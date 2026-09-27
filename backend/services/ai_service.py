import os
import cv2
import json
import logging
import numpy as np
from PIL import Image

# Windows OpenMP duplicate runtime fix
os.environ['KMP_DUPLICATE_LIB_OK'] = 'True'

import torch
import torch.nn as nn
from torchvision import transforms, models
from config import Config

logger = logging.getLogger(__name__)

class AIService:
    def __init__(self):
        self.conf_threshold = Config.AI_CONFIDENCE_THRESHOLD
        self.min_area_ratio = Config.MIN_GARBAGE_AREA_RATIO
        self.min_object_count = Config.MIN_GARBAGE_OBJECT_COUNT
        self.sample_rate = Config.VIDEO_FRAME_SAMPLE_COUNT
        self.confirmation_frames = Config.VIDEO_CONFIRMATION_FRAMES

        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.model = None
        self.eval_transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                 std=[0.229, 0.224, 0.225])
        ])
        self._load_trained_model()

    def _load_trained_model(self):
        model_path = Config.AI_MODEL_PATH
        if not os.path.exists(model_path):
            logger.warning(f"Trained AI model weights file not found at {model_path}. Running with fallback heuristic engine.")
            return

        try:
            logger.info(f"Loading trained PyTorch model from {model_path}...")
            weights = models.MobileNet_V2_Weights.DEFAULT
            m = models.mobilenet_v2(weights=None)
            in_features = m.classifier[1].in_features
            m.classifier = nn.Sequential(
                nn.Dropout(p=0.3),
                nn.Linear(in_features, 128),
                nn.ReLU(),
                nn.Dropout(p=0.2),
                nn.Linear(128, 2)
            )

            checkpoint = torch.load(model_path, map_location=self.device)
            if isinstance(checkpoint, dict) and 'model_state_dict' in checkpoint:
                m.load_state_dict(checkpoint['model_state_dict'])
            else:
                m.load_state_dict(checkpoint)

            m.to(self.device)
            m.eval()
            self.model = m
            logger.info("PyTorch Trained MobileNetV2 Garbage-Clean model successfully loaded!")
        except Exception as e:
            logger.error(f"Failed to load PyTorch model weights: {e}")
            self.model = None

    def predict_image_probs(self, img_pil):
        """
        Uses trained PyTorch model to infer probability of [clean, garbage].
        Returns (prob_clean, prob_garbage)
        """
        if self.model is None:
            # Fallback if model is loading or absent
            return 0.5, 0.5

        try:
            tensor = self.eval_transform(img_pil).unsqueeze(0).to(self.device)
            with torch.no_grad():
                logits = self.model(tensor)
                probs = torch.softmax(logits, dim=1).squeeze(0).cpu().numpy()
                return float(probs[0]), float(probs[1])  # 0: clean, 1: garbage
        except Exception as e:
            logger.error(f"Error predicting probabilities with PyTorch model: {e}")
            return 0.5, 0.5

    def analyze_image(self, image_path, save_annotated=True):
        """
        Analyzes a single image file for garbage vs cleanliness.
        Returns detailed inference results including dynamic cleanliness score.
        """
        if not os.path.exists(image_path):
            return {
                "accepted": False,
                "classification": "UNCERTAIN",
                "cleanliness_score": 50,
                "garbage_detected": False,
                "confidence": 0.0,
                "wasteType": "Unknown",
                "severity": "NONE",
                "objectCount": 0,
                "areaRatio": 0.0,
                "userMessage": "Image file not found",
                "evidencePath": None
            }

        try:
            img_cv = cv2.imread(image_path)
            if img_cv is None:
                return {
                    "accepted": False,
                    "classification": "UNCERTAIN",
                    "cleanliness_score": 50,
                    "garbage_detected": False,
                    "confidence": 0.0,
                    "wasteType": "Unknown",
                    "severity": "NONE",
                    "objectCount": 0,
                    "areaRatio": 0.0,
                    "userMessage": "Invalid or unreadable image file format",
                    "evidencePath": None
                }

            h, w, _ = img_cv.shape
            total_pixels = h * w

            # PyTorch Model Probabilities
            img_pil = Image.fromarray(cv2.cvtColor(img_cv, cv2.COLOR_BGR2RGB))
            p_clean, p_garbage = self.predict_image_probs(img_pil)

            # OpenCV Computer Vision Contour & Spatial Waste Extraction
            hsv = cv2.cvtColor(img_cv, cv2.COLOR_BGR2HSV)
            mask_artificial = cv2.inRange(hsv, np.array([0, 35, 50]), np.array([180, 255, 255]))
            mask_sludge = cv2.inRange(hsv, np.array([10, 15, 15]), np.array([38, 190, 150]))
            
            gray = cv2.cvtColor(img_cv, cv2.COLOR_BGR2GRAY)
            blur = cv2.GaussianBlur(gray, (5, 5), 0)
            edges = cv2.Canny(blur, 50, 150)

            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (15, 15))
            dilated = cv2.dilate(edges, kernel, iterations=2)
            closed = cv2.morphologyEx(dilated, cv2.MORPH_CLOSE, kernel)
            contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            bounding_boxes = []
            total_garbage_area = 0
            for cnt in contours:
                area = cv2.contourArea(cnt)
                if area > (total_pixels * 0.002):
                    x, y, bw, bh = cv2.boundingRect(cnt)
                    aspect_ratio = bw / float(bh)
                    if 0.2 <= aspect_ratio <= 5.0 and (bw * bh) > (total_pixels * 0.003):
                        bounding_boxes.append((x, y, bw, bh, area))
                        total_garbage_area += area

            object_count = len(bounding_boxes)
            area_ratio = total_garbage_area / float(total_pixels)

            # Calculate DYNAMIC CLEANLINESS SCORE (0% to 100%)
            # Higher garbage accumulation -> lower cleanliness score
            # Inputs: p_clean, p_garbage from PyTorch model, spatial area_ratio, object_count
            area_factor = min(1.0, area_ratio / 0.25)
            object_factor = min(1.0, object_count / 6.0)

            # Garbage intensity score (0.0 = completely clean, 1.0 = heavy pollution)
            garbage_intensity = (0.50 * p_garbage) + (0.35 * area_factor) + (0.15 * object_factor)
            raw_clean_score = (1.0 - garbage_intensity) * 100.0
            cleanliness_score = max(2, min(98, int(round(raw_clean_score))))

            # Confidence calculation from trained model + contour evidence
            confidence = round(max(p_clean, p_garbage) if self.model else min(0.98, (area_ratio * 4.0) + (object_count * 0.08) + 0.30), 2)

            # Determine Classification & Complaint Verdict
            classification = "CLEAN"
            accepted = False
            user_message = ""

            if p_clean > 0.65 and area_ratio < 0.015 and object_count <= 1:
                classification = "CLEAN"
                accepted = False
                user_message = f"Your uploaded place appears approximately {cleanliness_score}% clean. No significant garbage accumulation was detected."
            elif object_count <= 1 and area_ratio < 0.035 and p_garbage < 0.65:
                classification = "MINOR_LITTER"
                accepted = False
                user_message = f"Your uploaded place appears approximately {cleanliness_score}% clean. Only minor litter was detected."
            elif p_garbage >= 0.50 or area_ratio >= 0.035 or object_count >= 2:
                classification = "SIGNIFICANT_GARBAGE"
                accepted = True
                user_message = f"Significant garbage accumulation detected (Evaluated Cleanliness Score: {cleanliness_score}%). Your complaint is being submitted."
            else:
                classification = "UNCERTAIN"
                accepted = False
                user_message = "We could not confidently analyze the uploaded media. Please upload a clearer photo or video of the affected area."

            # Determine Waste Category & Severity
            if area_ratio >= 0.18 or object_count >= 6:
                severity = "CRITICAL"
                waste_type = "Roadside Heavy Garbage Dump"
            elif area_ratio >= 0.08 or object_count >= 4:
                severity = "HIGH"
                waste_type = "Mixed Waste Heap"
            elif area_ratio >= 0.03 or object_count >= 2:
                severity = "MEDIUM"
                waste_type = "Plastic Accumulation"
            else:
                severity = "LOW"
                waste_type = "Scattered Waste Area"

            annotated_path = None
            if save_annotated and (accepted or classification in ["SIGNIFICANT_GARBAGE", "MINOR_LITTER"]):
                annotated_img = img_cv.copy()
                for (x, y, bw, bh, area) in bounding_boxes:
                    cv2.rectangle(annotated_img, (x, y), (x + bw, y + bh), (0, 0, 230), 2)
                    cv2.putText(annotated_img, f"Waste {int((area/total_pixels)*100)}%", (x, max(y - 8, 15)),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 230), 2)

                cv2.rectangle(annotated_img, (0, 0), (w, 40), (0, 140, 0) if accepted else (0, 120, 200), -1)
                cv2.putText(annotated_img, f"AI {classification}: Clean {cleanliness_score}% | Conf {int(confidence*100)}% | {waste_type}",
                            (10, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

                base_name = os.path.basename(image_path)
                evidence_filename = f"evidence_{base_name}"
                annotated_path = os.path.join(Config.EVIDENCE_FOLDER, evidence_filename)
                cv2.imwrite(annotated_path, annotated_img)

            return {
                "accepted": accepted,
                "classification": classification,
                "cleanliness_score": cleanliness_score,
                "garbage_detected": (classification == "SIGNIFICANT_GARBAGE"),
                "confidence": confidence,
                "wasteType": waste_type,
                "severity": severity,
                "objectCount": object_count,
                "areaRatio": round(float(area_ratio), 4),
                "userMessage": user_message,
                "evidencePath": annotated_path or image_path,
                "analyzed_image_count": 1
            }

        except Exception as e:
            logger.error(f"Error in AIService analyze_image: {e}")
            return {
                "accepted": False,
                "classification": "UNCERTAIN",
                "cleanliness_score": 50,
                "garbage_detected": False,
                "confidence": 0.0,
                "wasteType": "Error",
                "severity": "NONE",
                "objectCount": 0,
                "areaRatio": 0.0,
                "userMessage": f"AI processing error: {str(e)}",
                "evidencePath": None,
                "analyzed_image_count": 1
            }

    def analyze_multi_images(self, image_paths):
        """
        Analyzes 1 to 3 images independently and aggregates multi-image AI findings.
        Aggregation Method: Evidence-Weighted Cleanliness Score
        Each image i has score S_i, area_ratio A_i, and confidence C_i.
        Weight w_i = 1.0 + (A_i * 5.0) + (0.5 if accepted else 0.0)
        Aggregated Score = round( sum(w_i * S_i) / sum(w_i) )
        """
        if not image_paths:
            return {
                "accepted": False,
                "classification": "UNCERTAIN",
                "cleanliness_score": 50,
                "garbage_detected": False,
                "confidence": 0.0,
                "userMessage": "No images provided for analysis.",
                "imageResults": [],
                "analyzed_image_count": 0
            }

        results = []
        for path in image_paths:
            res = self.analyze_image(path, save_annotated=True)
            results.append(res)

        # Aggregate metrics across 1 to 3 images
        accepted_count = sum(1 for r in results if r.get('accepted'))
        confidences = [r.get('confidence', 0.0) for r in results]
        object_counts = [r.get('objectCount', 0) for r in results]
        area_ratios = [r.get('areaRatio', 0.0) for r in results]

        # Calculate evidence-weighted cleanliness score across 1-3 images
        total_weight = 0.0
        weighted_score_sum = 0.0
        for r in results:
            s_i = r.get('cleanliness_score', 50)
            a_i = r.get('areaRatio', 0.0)
            acc_i = r.get('accepted', False)
            w_i = 1.0 + (a_i * 5.0) + (0.5 if acc_i else 0.0)
            weighted_score_sum += (w_i * s_i)
            total_weight += w_i

        avg_cleanliness = max(2, min(98, int(round(weighted_score_sum / total_weight)))) if total_weight > 0 else 50
        max_confidence = max(confidences) if confidences else 0.0
        max_objects = max(object_counts) if object_counts else 0
        max_area = max(area_ratios) if area_ratios else 0.0

        if accepted_count >= 1 or max_objects >= 2 or max_area >= 0.035:
            classification = "SIGNIFICANT_GARBAGE"
            accepted = True
            user_message = f"Significant garbage accumulation detected across submitted photos (Evaluated Cleanliness Score: {avg_cleanliness}%). Your complaint is being submitted."
        elif all(r.get('classification') == 'CLEAN' for r in results):
            classification = "CLEAN"
            accepted = False
            user_message = f"Your uploaded place appears approximately {avg_cleanliness}% clean across submitted photos. No significant garbage accumulation was detected."
        elif any(r.get('classification') == 'MINOR_LITTER' for r in results):
            classification = "MINOR_LITTER"
            accepted = False
            user_message = f"Your uploaded place appears approximately {avg_cleanliness}% clean across submitted photos. Only minor litter was detected."
        else:
            classification = "UNCERTAIN"
            accepted = False
            user_message = "We could not confidently analyze the uploaded media. Please upload a clearer photo or video of the affected area."

        best_res = max(results, key=lambda x: (x.get('areaRatio', 0.0), x.get('confidence', 0.0)))

        return {
            "accepted": accepted,
            "classification": classification,
            "cleanliness_score": avg_cleanliness,
            "garbage_detected": accepted,
            "confidence": max_confidence,
            "wasteType": best_res.get('wasteType', 'Mixed Waste'),
            "severity": best_res.get('severity', 'MEDIUM'),
            "objectCount": max_objects,
            "areaRatio": max_area,
            "userMessage": user_message,
            "evidencePath": best_res.get('evidencePath'),
            "imageResults": results,
            "analyzed_image_count": len(image_paths)
        }

    def analyze_video(self, video_path):
        """
        Processes video server-side in Python:
        1. Samples frames at regular intervals (VIDEO_FRAME_SAMPLE_COUNT).
        2. Analyzes each sampled frame independently.
        3. Aggregates multi-frame evidence and calculates video cleanliness score.
        4. Selects TWO BEST distinct evidence frames (evidence_frame_01.jpg and evidence_frame_02.jpg).
        """
        if not os.path.exists(video_path):
            return {
                "accepted": False,
                "classification": "UNCERTAIN",
                "cleanliness_score": 50,
                "garbage_detected": False,
                "confidence": 0.0,
                "userMessage": "Video file not found.",
                "sampled_frame_count": 0,
                "positive_frame_count": 0,
                "evidence_frame_count": 0
            }

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            return {
                "accepted": False,
                "classification": "UNCERTAIN",
                "cleanliness_score": 50,
                "garbage_detected": False,
                "confidence": 0.0,
                "userMessage": "Unable to open video stream.",
                "sampled_frame_count": 0,
                "positive_frame_count": 0,
                "evidence_frame_count": 0
            }

        frame_count = 0
        total_sampled = 0
        positive_frames = 0
        frame_evaluations = []

        base_vid_name = os.path.basename(video_path)
        temp_dir = os.path.join(Config.UPLOAD_FOLDER, 'temp_frames')
        os.makedirs(temp_dir, exist_ok=True)

        try:
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                frame_count += 1
                if frame_count % self.sample_rate != 0:
                    continue

                total_sampled += 1
                frame_filename = f"temp_frame_{base_vid_name}_{total_sampled:03d}.jpg"
                temp_frame_path = os.path.join(temp_dir, frame_filename)
                cv2.imwrite(temp_frame_path, frame)

                res = self.analyze_image(temp_frame_path, save_annotated=False)
                res['frame_index'] = frame_count
                res['sampled_index'] = total_sampled
                res['temp_path'] = temp_frame_path
                res['raw_frame'] = frame.copy()
                frame_evaluations.append(res)

                if res.get('accepted') or res.get('classification') == 'SIGNIFICANT_GARBAGE':
                    positive_frames += 1

        finally:
            cap.release()

        if total_sampled == 0:
            return {
                "accepted": False,
                "classification": "UNCERTAIN",
                "cleanliness_score": 50,
                "garbage_detected": False,
                "confidence": 0.0,
                "userMessage": "Video contained no readable frames.",
                "sampled_frame_count": 0,
                "positive_frame_count": 0,
                "evidence_frame_count": 0
            }

        persistence_ratio = positive_frames / float(total_sampled)
        accepted = (positive_frames >= self.confirmation_frames and persistence_ratio >= 0.25)

        # Select TWO BEST EVIDENCE FRAMES
        # Sort evaluated frames by garbage evidence score: areaRatio * confidence + objectCount * 0.05
        sorted_frames = sorted(frame_evaluations, key=lambda f: (f.get('areaRatio', 0.0) * f.get('confidence', 0.0) + f.get('objectCount', 0) * 0.05), reverse=True)

        evidence_1_path = None
        evidence_2_path = None

        if sorted_frames:
            best_1 = sorted_frames[0]
            raw_1 = best_1['raw_frame'].copy()
            if best_1.get('objectCount', 0) > 0:
                cv2.rectangle(raw_1, (0, 0), (raw_1.shape[1], 40), (0, 0, 200), -1)
                cv2.putText(raw_1, f"AI Video Frame #1: Clean {best_1.get('cleanliness_score')}% | Conf {int(best_1.get('confidence', 0)*100)}%",
                            (10, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
            e1_name = f"evidence_vid_{base_vid_name}_frame01.jpg"
            evidence_1_path = os.path.join(Config.EVIDENCE_FOLDER, e1_name)
            cv2.imwrite(evidence_1_path, raw_1)

            best_2 = sorted_frames[1] if len(sorted_frames) > 1 else sorted_frames[0]
            raw_2 = best_2['raw_frame'].copy()
            if best_2.get('objectCount', 0) > 0:
                cv2.rectangle(raw_2, (0, 0), (raw_2.shape[1], 40), (0, 0, 200), -1)
                cv2.putText(raw_2, f"AI Video Frame #2: Clean {best_2.get('cleanliness_score')}% | Conf {int(best_2.get('confidence', 0)*100)}%",
                            (10, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)
            e2_name = f"evidence_vid_{base_vid_name}_frame02.jpg"
            evidence_2_path = os.path.join(Config.EVIDENCE_FOLDER, e2_name)
            cv2.imwrite(evidence_2_path, raw_2)

        # Clean up temporary frame files
        for fe in frame_evaluations:
            t_path = fe.get('temp_path')
            if t_path and os.path.exists(t_path):
                try:
                    os.remove(t_path)
                except Exception:
                    pass

        # Aggregate video cleanliness score across all sampled frames weighted by evidence
        total_frame_weight = 0.0
        weighted_frame_score_sum = 0.0
        for fe in frame_evaluations:
            f_score = fe.get('cleanliness_score', 50)
            f_area = fe.get('areaRatio', 0.0)
            f_acc = fe.get('accepted', False)
            f_w = 1.0 + (f_area * 5.0) + (0.5 if f_acc else 0.0)
            weighted_frame_score_sum += (f_w * f_score)
            total_frame_weight += f_w

        avg_cleanliness = max(2, min(98, int(round(weighted_frame_score_sum / total_frame_weight)))) if total_frame_weight > 0 else 50
        max_conf = max((f.get('confidence', 0.0) for f in frame_evaluations), default=0.0)
        best_eval = sorted_frames[0] if sorted_frames else {}

        if accepted:
            classification = "SIGNIFICANT_GARBAGE"
            user_message = f"Significant garbage accumulation verified across video frames (Evaluated Cleanliness Score: {avg_cleanliness}%). Your complaint is being submitted."
        else:
            classification = "CLEAN" if avg_cleanliness >= 70 else "MINOR_LITTER"
            user_message = f"Your uploaded video appears approximately {avg_cleanliness}% clean. No persistent significant garbage accumulation was detected across video frames."

        return {
            "accepted": accepted,
            "classification": classification,
            "cleanliness_score": avg_cleanliness,
            "garbage_detected": accepted,
            "confidence": max_conf,
            "wasteType": best_eval.get('wasteType', 'Mixed Waste'),
            "severity": best_eval.get('severity', 'HIGH' if accepted else 'LOW'),
            "objectCount": best_eval.get('objectCount', 0),
            "areaRatio": best_eval.get('areaRatio', 0.0),
            "userMessage": user_message,
            "evidencePath": evidence_1_path,
            "evidenceFrame1Path": evidence_1_path,
            "evidenceFrame2Path": evidence_2_path,
            "sampledFramesCount": total_sampled,
            "positiveFramesCount": positive_frames,
            "sampled_frame_count": total_sampled,
            "positive_frame_count": positive_frames,
            "evidence_frame_count": 2 if evidence_2_path else 1,
            "videoPersistence": round(persistence_ratio, 2)
        }

ai_service = AIService()
