import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from config import Config
from services.cctv_service import cctv_service
from services.firebase_service import firebase_service

cctv_bp = Blueprint('cctv', __name__)

@cctv_bp.route('/api/cctv/cameras', methods=['GET'])
def get_cameras():
    """
    Returns registered CCTV camera feeds and locations.
    """
    cameras = firebase_service.get_cameras()
    return jsonify({'success': True, 'cameras': cameras}), 200

@cctv_bp.route('/api/cctv/process-video', methods=['POST'])
def process_cctv_video():
    """
    CCTV Prototype Endpoint.
    Simulates or processes a CCTV video file stream for a registered camera.
    """
    try:
        if 'video' not in request.files:
            return jsonify({'success': False, 'message': 'Please upload a CCTV test video file.'}), 400

        camera_id = request.form.get('cameraId', 'CAM-001')
        file = request.files['video']
        
        if file.filename == '':
            return jsonify({'success': False, 'message': 'No video file selected'}), 400

        Config.ensure_directories()
        unique_name = f"cctv_{secure_filename(file.filename)}"
        video_path = os.path.join(Config.CCTV_FOLDER, unique_name)
        file.save(video_path)

        # Execute CCTV Automated Garbage Detection Pipeline
        result = cctv_service.process_cctv_feed(video_path, camera_id=camera_id)
        
        return jsonify({
            'success': True,
            'result': result
        }), 200

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500
