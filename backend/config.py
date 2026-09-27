import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    FLASK_ENV = os.getenv('FLASK_ENV', 'development')
    PORT = int(os.getenv('PORT', 5000))
    SECRET_KEY = os.getenv('SECRET_KEY', 'default-swachh-bharat-secret')
    
    # Admin Auth Configuration
    ADMIN_EMAIL = os.getenv('ADMIN_EMAIL', 'admin@gov.in')
    ADMIN_PASSWORD = os.getenv('ADMIN_PASSWORD', 'admin@123')
    
    # Firebase Configuration
    FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID', '')
    FIREBASE_CLIENT_EMAIL = os.getenv('FIREBASE_CLIENT_EMAIL', '')
    FIREBASE_PRIVATE_KEY = os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n')
    FIREBASE_STORAGE_BUCKET = os.getenv('FIREBASE_STORAGE_BUCKET', '')
    
    # Telegram Bot Configuration
    TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '')
    TELEGRAM_ADMIN_CHAT_ID = os.getenv('TELEGRAM_ADMIN_CHAT_ID', '5165384178')
    
    # AI Computer Vision Thresholds
    AI_CONFIDENCE_THRESHOLD = float(os.getenv('AI_CONFIDENCE_THRESHOLD', 0.50))
    MIN_GARBAGE_AREA_RATIO = float(os.getenv('MIN_GARBAGE_AREA_RATIO', 0.05))
    MIN_GARBAGE_OBJECT_COUNT = int(os.getenv('MIN_GARBAGE_OBJECT_COUNT', 2))
    VIDEO_FRAME_SAMPLE_COUNT = int(os.getenv('VIDEO_FRAME_SAMPLE_COUNT', 15))
    VIDEO_CONFIRMATION_FRAMES = int(os.getenv('VIDEO_CONFIRMATION_FRAMES', 2))
    CCTV_CONFIRMATION_FRAMES = int(os.getenv('CCTV_CONFIRMATION_FRAMES', 3))
    CCTV_DETECTION_COOLDOWN = int(os.getenv('CCTV_DETECTION_COOLDOWN', 300))
    
    # AI Model Storage Path
    AI_MODEL_PATH = os.path.join(os.path.abspath(os.path.dirname(__file__)), 'ai', 'model', 'garbage_clean_model.pth')
    
    # CORS Settings
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', 'http://localhost:5173,http://localhost:3000').split(',')
    
    # Media Storage Settings
    BASE_DIR = os.path.abspath(os.path.dirname(__file__))
    UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
    EVIDENCE_FOLDER = os.path.join(UPLOAD_FOLDER, 'evidence')
    CCTV_FOLDER = os.path.join(UPLOAD_FOLDER, 'cctv')
    
    # Maximum upload size: 50MB for video support
    MAX_CONTENT_LENGTH = 50 * 1024 * 1024

    @classmethod
    def ensure_directories(cls):
        os.makedirs(cls.UPLOAD_FOLDER, exist_ok=True)
        os.makedirs(cls.EVIDENCE_FOLDER, exist_ok=True)
        os.makedirs(cls.CCTV_FOLDER, exist_ok=True)
        os.makedirs(os.path.join(cls.BASE_DIR, 'data'), exist_ok=True)
