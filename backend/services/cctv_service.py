import os
import time
import logging
import uuid
from datetime import datetime, timezone
from config import Config
from services.ai_service import ai_service
from services.firebase_service import firebase_service
from services.telegram_service import telegram_service

logger = logging.getLogger(__name__)

# Active camera cooldown timestamps tracker (Camera ID -> last complaint creation timestamp)
CAM_COOLDOWNS = {}

class CCTVService:
    def __init__(self):
        self.cooldown_seconds = Config.CCTV_DETECTION_COOLDOWN
        self.required_confirmation_frames = Config.CCTV_CONFIRMATION_FRAMES

    def process_cctv_feed(self, video_path, camera_id="CAM-001"):
        """
        Processes a CCTV stream/video file, applies multi-frame verification,
        respects camera cooldown windows, creates incidents in DB, and fires Telegram alerts.
        """
        camera = firebase_service.get_camera_by_id(camera_id)
        if not camera:
            camera = {
                "id": camera_id,
                "name": f"Camera {camera_id}",
                "location": "Municipal CCTV Stream Point",
                "latitude": 17.4849,
                "longitude": 78.4138
            }

        # Check camera cooldown deduplication
        now_time = time.time()
        last_triggered = CAM_COOLDOWNS.get(camera_id, 0)
        if (now_time - last_triggered) < self.cooldown_seconds:
            remaining = int(self.cooldown_seconds - (now_time - last_triggered))
            logger.info(f"CCTV detection skipped for camera {camera_id}: Cooldown active ({remaining}s remaining).")
            return {
                "status": "COOLDOWN_ACTIVE",
                "message": f"Camera {camera_id} is in cooldown period ({remaining}s remaining). Duplicate incident prevented.",
                "complaintCreated": False
            }

        # Run AI Video Persistence Analysis
        ai_result = ai_service.analyze_video(video_path, sample_rate=10)

        if not ai_result.get('accepted'):
            return {
                "status": "NO_GARBAGE_DETECTED",
                "message": ai_result.get('reason', 'No significant garbage detected in CCTV feed.'),
                "complaintCreated": False,
                "aiResult": ai_result
            }

        # Create Complaint Record from CCTV Detection
        complaint_id = f"CCTV-{uuid.uuid4().hex[:6].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()
        
        evidence_path = ai_result.get('evidencePath', '')
        media_url = f"/api/uploads/evidence/{os.path.basename(evidence_path)}" if evidence_path else None

        complaint_data = {
            "id": complaint_id,
            "source": "CCTV",
            "cameraId": camera.get('id'),
            "cameraName": camera.get('name'),
            "reporterName": "CCTV AI Automated Detector",
            "reporterPhone": "N/A",
            "description": f"Automated AI detection from CCTV camera {camera.get('name')}",
            "mediaType": "VIDEO",
            "mediaUrl": media_url,
            "evidenceFrameUrl": media_url,
            "wasteType": ai_result.get('wasteType', 'Mixed Waste'),
            "garbageDetected": True,
            "aiConfidence": ai_result.get('confidence', 0.90),
            "garbageObjectCount": ai_result.get('objectCount', 3),
            "garbageAreaRatio": ai_result.get('areaRatio', 0.08),
            "severity": ai_result.get('severity', 'HIGH'),
            "latitude": camera.get('latitude', 17.4849),
            "longitude": camera.get('longitude', 78.4138),
            "address": camera.get('location', 'CCTV Location'),
            "status": "NEW",
            "createdAt": now_iso,
            "updatedAt": now_iso,
            "telegramNotificationSent": False
        }

        # 1. Save to Database
        saved_doc = firebase_service.save_complaint(complaint_data)

        # 2. Update Cooldown Window
        CAM_COOLDOWNS[camera_id] = now_time

        # 3. Trigger Telegram Alert asynchronously / non-blocking
        telegram_success, tele_err = telegram_service.send_complaint_notification(saved_doc, evidence_path)
        firebase_service.update_notification_status(complaint_id, telegram_success, tele_err)

        return {
            "status": "SUCCESS",
            "message": f"Significant garbage confirmed by CCTV {camera_id}. Incident #{complaint_id} created.",
            "complaintCreated": True,
            "complaint": saved_doc,
            "telegramSent": telegram_success
        }

cctv_service = CCTVService()
