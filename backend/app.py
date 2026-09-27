import os
import logging
from flask import Flask, send_from_directory, jsonify
from flask_cors import CORS
from config import Config
from services.cleanup_service import cleanup_scheduler

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format='[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
)

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Ensure required server storage directories exist
    Config.ensure_directories()

    # Configure CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register API Blueprints
    from routes.complaint_routes import complaint_bp
    from routes.admin_routes import admin_bp
    from routes.ai_routes import ai_bp
    from routes.cctv_routes import cctv_bp

    app.register_blueprint(complaint_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(ai_bp)
    app.register_blueprint(cctv_bp)

    # Serve uploaded evidence media files securely
    @app.route('/api/uploads/<path:filename>', methods=['GET'])
    def serve_upload(filename):
        return send_from_directory(Config.UPLOAD_FOLDER, filename)

    @app.route('/api/uploads/evidence/<path:filename>', methods=['GET'])
    def serve_evidence(filename):
        return send_from_directory(Config.EVIDENCE_FOLDER, filename)

    # Health check endpoint
    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            'status': 'HEALTHY',
            'service': 'AI Se Swachh Bharat API',
            'version': '1.0.0'
        }), 200

    # Start 24-Hour Complaint Cleanup Scheduler
    try:
        cleanup_scheduler.start()
    except Exception as e:
        app.logger.warning(f"Failed to start cleanup scheduler: {e}")

    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', Config.PORT))
    app.logger.info(f"Starting AI Se Swachh Bharat Flask API Server on port {port}...")

    app.run(host='0.0.0.0', port=port, debug=(Config.FLASK_ENV == 'development'))
