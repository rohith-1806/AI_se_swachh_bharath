import os
import json
from flask import Blueprint, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from config import Config
from services.ai_service import ai_service

ai_bp = Blueprint('ai', __name__)

@ai_bp.route('/api/ai/analyze-image', methods=['POST'])
def analyze_image_endpoint():
    """
    Direct test endpoint for AI image analysis & cleanliness calculation.
    Supports single or multiple image uploads.
    """
    uploaded_files = []
    if 'image' in request.files:
        uploaded_files = request.files.getlist('image')
    elif 'media' in request.files:
        uploaded_files = request.files.getlist('media')

    for k in request.files:
        if k.startswith('image_') or k.startswith('media_'):
            uploaded_files.extend(request.files.getlist(k))

    uploaded_files = [f for f in uploaded_files if f and f.filename != '']

    if not uploaded_files:
        return jsonify({'success': False, 'message': 'No image file uploaded'}), 400

    Config.ensure_directories()
    saved_paths = []
    for file in uploaded_files:
        file_path = os.path.join(Config.UPLOAD_FOLDER, f"test_{secure_filename(file.filename)}")
        file.save(file_path)
        saved_paths.append(file_path)

    if len(saved_paths) == 1:
        result = ai_service.analyze_image(saved_paths[0])
    else:
        result = ai_service.analyze_multi_images(saved_paths)

    return jsonify({'success': True, 'aiResult': result}), 200

@ai_bp.route('/api/ai/analyze-video', methods=['POST'])
def analyze_video_endpoint():
    """
    Direct test endpoint for AI video persistence & frame extraction.
    """
    if 'video' not in request.files and 'media' not in request.files:
        return jsonify({'success': False, 'message': 'No video file uploaded'}), 400

    file = request.files.get('video') or request.files.get('media')
    if not file or file.filename == '':
        return jsonify({'success': False, 'message': 'Invalid video file'}), 400

    Config.ensure_directories()
    file_path = os.path.join(Config.UPLOAD_FOLDER, f"test_{secure_filename(file.filename)}")
    file.save(file_path)

    result = ai_service.analyze_video(file_path)
    return jsonify({'success': True, 'aiResult': result}), 200

@ai_bp.route('/api/ai/metrics', methods=['GET'])
def get_ai_metrics():
    """
    Retrieves model evaluation metrics (metrics.json, confusion matrix image URL).
    """
    eval_dir = os.path.join(Config.BASE_DIR, 'ai', 'evaluation')
    metrics_path = os.path.join(eval_dir, 'metrics.json')

    metrics_data = {}
    if os.path.exists(metrics_path):
        try:
            with open(metrics_path, 'r', encoding='utf-8') as f:
                metrics_data = json.load(f)
        except Exception as e:
            metrics_data = {"error": str(e)}

    return jsonify({
        'success': True,
        'metrics': metrics_data,
        'confusionMatrixUrl': '/api/ai/evaluation/confusion_matrix.png'
    }), 200

@ai_bp.route('/api/ai/evaluation/<path:filename>', methods=['GET'])
def serve_evaluation_file(filename):
    eval_dir = os.path.join(Config.BASE_DIR, 'ai', 'evaluation')
    return send_from_directory(eval_dir, filename)
