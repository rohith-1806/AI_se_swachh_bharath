import os
import uuid
from datetime import datetime, timezone
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
from config import Config
from services.ai_service import ai_service
from services.firebase_service import firebase_service
from services.telegram_service import telegram_service

complaint_bp = Blueprint('complaints', __name__)

ALLOWED_IMAGE_EXTS = {'jpg', 'jpeg', 'png', 'webp'}
ALLOWED_VIDEO_EXTS = {'mp4', 'mov', 'webm', 'avi'}

def allowed_file(filename, allowed_set):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_set

@complaint_bp.route('/api/complaints', methods=['POST'])
def create_complaint():
    """
    Public Citizen Report API Endpoint.
    Supports uploading 1 to 3 images OR 1 video.
    Executes AI model detection, demands significant waste accumulation,
    persists complaint, notifies admin via Telegram, and returns confirmation.
    """
    try:
        # Collect uploaded media files
        uploaded_files = []
        if 'media' in request.files:
            uploaded_files = request.files.getlist('media')
        
        # Also check indexed field names if provided
        for key in request.files:
            if key.startswith('media_') or key == 'file':
                uploaded_files.extend(request.files.getlist(key))

        # Filter out empty entries
        uploaded_files = [f for f in uploaded_files if f and f.filename != '']

        if not uploaded_files:
            return jsonify({
                'success': False,
                'message': 'Please select 1 to 3 photos or 1 video to upload.'
            }), 400

        # Maximum 3 images limit
        if len(uploaded_files) > 3:
            return jsonify({
                'success': False,
                'message': 'Maximum 3 images allowed per complaint submission.'
            }), 400

        Config.ensure_directories()
        saved_file_paths = []
        is_video_complaint = False
        media_relative_urls = []

        for file in uploaded_files:
            filename = secure_filename(file.filename)
            ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
            
            is_img = ext in ALLOWED_IMAGE_EXTS
            is_vid = ext in ALLOWED_VIDEO_EXTS

            if not (is_img or is_vid):
                return jsonify({
                    'success': False,
                    'message': 'Unsupported file format. Please upload JPG, PNG, WEBP, MP4, MOV, or WEBM.'
                }), 400

            if is_vid:
                is_video_complaint = True

            unique_filename = f"{uuid.uuid4().hex}_{filename}"
            file_path = os.path.join(Config.UPLOAD_FOLDER, unique_filename)
            file.save(file_path)
            saved_file_paths.append(file_path)
            media_relative_urls.append(f"/api/uploads/{unique_filename}")

        # Parse citizen details
        reporter_name = request.form.get('reporterName', 'Anonymous Citizen').strip()
        reporter_phone = request.form.get('reporterPhone', '').strip()
        description = request.form.get('description', '').strip()
        
        lat_val = request.form.get('latitude')
        lng_val = request.form.get('longitude')
        address = request.form.get('address', '').strip() or 'Location provided via GPS'

        try:
            latitude = float(lat_val) if lat_val else None
            longitude = float(lng_val) if lng_val else None
        except ValueError:
            latitude = None
            longitude = None

        if latitude is None or longitude is None:
            latitude = 17.4849
            longitude = 78.4138

        # --- STEP 1: AI GARBAGE & CLEANLINESS MODEL ANALYSIS ---
        if is_video_complaint:
            ai_res = ai_service.analyze_video(saved_file_paths[0])
        else:
            if len(saved_file_paths) == 1:
                ai_res = ai_service.analyze_image(saved_file_paths[0])
            else:
                ai_res = ai_service.analyze_multi_images(saved_file_paths)

        # Evaluate AI Acceptance
        if not ai_res.get('accepted'):
            user_msg = ai_res.get('userMessage') or "We could not detect significant garbage accumulation in the uploaded media. Please upload a clear photo or video showing the affected area."
            return jsonify({
                'success': False,
                'rejectedByAI': True,
                'message': user_msg,
                'cleanlinessScore': ai_res.get('cleanliness_score'),
                'aiClassification': ai_res.get('classification', 'CLEAN'),
                'aiDetails': ai_res
            }), 200

        # --- STEP 2: CREATE & PERSIST COMPLAINT RECORD ---
        complaint_id = f"GC-{uuid.uuid4().hex[:6].upper()}"
        now_iso = datetime.now(timezone.utc).isoformat()
        
        evidence_path = ai_res.get('evidencePath')
        evidence1_path = ai_res.get('evidenceFrame1Path') or evidence_path
        evidence2_path = ai_res.get('evidenceFrame2Path')

        evidence_url = media_relative_urls[0]
        evidence1_url = media_relative_urls[0]
        evidence2_url = None

        if evidence1_path and os.path.exists(evidence1_path):
            evidence1_url = f"/api/uploads/evidence/{os.path.basename(evidence1_path)}"
            evidence_url = evidence1_url

        if evidence2_path and os.path.exists(evidence2_path):
            evidence2_url = f"/api/uploads/evidence/{os.path.basename(evidence2_path)}"

        complaint_data = {
            "id": complaint_id,
            "source": "USER",
            "reporterName": reporter_name or "Anonymous Citizen",
            "reporterPhone": reporter_phone or "Not Provided",
            "description": description or "Garbage accumulation reported by citizen.",
            "mediaType": "VIDEO" if is_video_complaint else "IMAGE",
            "mediaUrl": media_relative_urls[0],
            "mediaUrls": media_relative_urls,
            "evidenceFrameUrl": evidence_url,
            "evidenceFrame1Url": evidence1_url,
            "evidenceFrame2Url": evidence2_url,
            "wasteType": ai_res.get('wasteType', 'Mixed Waste'),
            "garbageDetected": True,
            "aiClassification": ai_res.get('classification', 'SIGNIFICANT_GARBAGE'),
            "aiConfidence": ai_res.get('confidence', 0.90),
            "cleanlinessScore": ai_res.get('cleanliness_score'),
            "garbageObjectCount": ai_res.get('objectCount', 2),
            "garbageAreaRatio": ai_res.get('areaRatio', 0.08),
            "sampledFramesCount": ai_res.get('sampledFramesCount', 1 if not is_video_complaint else 0),
            "positiveFramesCount": ai_res.get('positiveFramesCount', 1 if not is_video_complaint else 0),
            "analyzedImageCount": ai_res.get('analyzed_image_count', len(saved_file_paths)),
            "severity": ai_res.get('severity', 'HIGH'),
            "latitude": latitude,
            "longitude": longitude,
            "address": address,
            "status": "NEW",
            "createdAt": now_iso,
            "updatedAt": now_iso,
            "telegramNotificationSent": False
        }

        # Save complaint to database
        saved_doc = firebase_service.save_complaint(complaint_data)
        current_app.logger.info(f"Complaint created: #{complaint_id}")

        # --- STEP 3: TELEGRAM ADMIN NOTIFICATION ---
        tele_photo_target = evidence1_path if (evidence1_path and os.path.exists(evidence1_path)) else saved_file_paths[0]
        tele_success, tele_err = telegram_service.send_complaint_notification(saved_doc, tele_photo_target)
        firebase_service.update_notification_status(complaint_id, tele_success, tele_err)

        return jsonify({
            'success': True,
            'message': ai_res.get('userMessage') or 'Significant garbage accumulation detected. Your complaint is being submitted.',
            'complaintId': complaint_id,
            'complaint': saved_doc,
            'cleanlinessScore': ai_res.get('cleanliness_score'),
            'aiClassification': ai_res.get('classification')
        }), 201

    except Exception as e:
        current_app.logger.error(f"Error in create_complaint endpoint: {e}")
        return jsonify({
            'success': False,
            'message': f"Server error processing complaint: {str(e)}"
        }), 500

@complaint_bp.route('/api/complaints', methods=['GET'])
def get_complaints():
    try:
        status_filter = request.args.get('status')
        source_filter = request.args.get('source')
        search_query = request.args.get('search', '').lower()

        complaints = firebase_service.get_complaints(limit=200, status_filter=status_filter, source_filter=source_filter)
        
        if search_query:
            complaints = [
                c for c in complaints if (
                    search_query in c.get('id', '').lower() or
                    search_query in c.get('address', '').lower() or
                    search_query in c.get('reporterName', '').lower() or
                    search_query in c.get('reporterPhone', '').lower()
                )
            ]

        return jsonify({
            'success': True,
            'count': len(complaints),
            'complaints': complaints
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@complaint_bp.route('/api/complaints/<complaint_id>', methods=['GET'])
def get_complaint(complaint_id):
    try:
        complaint = firebase_service.get_complaint_by_id(complaint_id)
        if not complaint:
            return jsonify({'success': False, 'message': 'Complaint not found'}), 404
        return jsonify({'success': True, 'complaint': complaint}), 200
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
