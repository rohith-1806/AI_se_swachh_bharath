import os
import json
import logging
from datetime import datetime, timezone
import firebase_admin
from firebase_admin import credentials, firestore, storage
from config import Config

logger = logging.getLogger(__name__)

class FirebaseService:
    def __init__(self):
        self.db = None
        self.bucket = None
        self.use_fallback = False
        self.fallback_file = os.path.join(Config.BASE_DIR, 'data', 'db.json')
        self._init_firebase()

    def _init_firebase(self):
        # Check if Firebase credentials are properly provided in environment
        if Config.FIREBASE_PROJECT_ID and Config.FIREBASE_CLIENT_EMAIL and Config.FIREBASE_PRIVATE_KEY:
            try:
                cred_dict = {
                    "type": "service_account",
                    "project_id": Config.FIREBASE_PROJECT_ID,
                    "client_email": Config.FIREBASE_CLIENT_EMAIL,
                    "private_key": Config.FIREBASE_PRIVATE_KEY
                }
                cred = credentials.Certificate(cred_dict)
                if not firebase_admin._apps:
                    firebase_admin.initialize_app(cred, {
                        'storageBucket': Config.FIREBASE_STORAGE_BUCKET or f"{Config.FIREBASE_PROJECT_ID}.appspot.com"
                    })
                self.db = firestore.client()
                try:
                    self.bucket = storage.bucket()
                except Exception as e:
                    logger.warning(f"Firebase Storage bucket init warning: {e}")
                logger.info("Firebase Admin SDK successfully initialized.")
                return
            except Exception as e:
                logger.error(f"Failed to initialize Firebase Admin SDK: {e}. Falling back to local store.")
        
        # Fallback local JSON database mode for local dev without secrets
        self.use_fallback = True
        logger.info("Operating in Local Datastore mode (Firestore fallback).")
        self._ensure_fallback_db()

    def _ensure_fallback_db(self):
        os.makedirs(os.path.dirname(self.fallback_file), exist_ok=True)
        if not os.path.exists(self.fallback_file):
            initial_data = {
                "complaints": [],
                "cameras": [
                    {
                        "id": "CAM-001",
                        "name": "Kukatpally Main Junction Camera",
                        "location": "Road No 1, Kukatpally, Hyderabad",
                        "latitude": 17.4849,
                        "longitude": 78.4138,
                        "status": "ACTIVE"
                    },
                    {
                        "id": "CAM-002",
                        "name": "Hi-Tech City Flyover Camera",
                        "location": "Cyber Towers Junction, Madhapur",
                        "latitude": 17.4504,
                        "longitude": 78.3808,
                        "status": "ACTIVE"
                    }
                ],
                "admins": [],
                "history": [],
                "notification_logs": []
            }
            with open(self.fallback_file, 'w') as f:
                json.dump(initial_data, f, indent=2)

    def _read_fallback(self):
        try:
            with open(self.fallback_file, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Error reading local db fallback: {e}")
            return {"complaints": [], "cameras": [], "admins": [], "history": [], "notification_logs": []}

    def _write_fallback(self, data):
        try:
            with open(self.fallback_file, 'w') as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Error writing local db fallback: {e}")

    # --- COMPLAINTS OPERATIONS ---
    def save_complaint(self, complaint_data):
        complaint_id = complaint_data.get('id')
        now_str = datetime.now(timezone.utc).isoformat()
        complaint_data['createdAt'] = complaint_data.get('createdAt', now_str)
        complaint_data['updatedAt'] = now_str
        
        if not self.use_fallback and self.db:
            try:
                self.db.collection('complaints').document(complaint_id).set(complaint_data)
                return complaint_data
            except Exception as e:
                logger.error(f"Firestore save error: {e}")

        # Fallback
        db_data = self._read_fallback()
        db_data['complaints'].append(complaint_data)
        self._write_fallback(db_data)
        return complaint_data

    def get_complaints(self, limit=100, status_filter=None, source_filter=None):
        if not self.use_fallback and self.db:
            try:
                query = self.db.collection('complaints')
                if status_filter:
                    query = query.where('status', '==', status_filter)
                if source_filter:
                    query = query.where('source', '==', source_filter)
                docs = query.limit(limit).stream()
                res = [doc.to_dict() for doc in docs]
                res.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
                return res
            except Exception as e:
                logger.error(f"Firestore get complaints error: {e}")

        # Fallback
        db_data = self._read_fallback()
        res = db_data.get('complaints', [])
        if status_filter:
            res = [c for c in res if c.get('status') == status_filter]
        if source_filter:
            res = [c for c in res if c.get('source') == source_filter]
        res.sort(key=lambda x: x.get('createdAt', ''), reverse=True)
        return res[:limit]

    def get_complaint_by_id(self, complaint_id):
        if not self.use_fallback and self.db:
            try:
                doc = self.db.collection('complaints').document(complaint_id).get()
                if doc.exists:
                    return doc.to_dict()
            except Exception as e:
                logger.error(f"Firestore doc get error: {e}")

        # Fallback
        db_data = self._read_fallback()
        for c in db_data.get('complaints', []):
            if c.get('id') == complaint_id:
                return c
        return None

    def update_complaint_status(self, complaint_id, new_status, extra_fields=None):
        now_str = datetime.now(timezone.utc).isoformat()
        updates = {'status': new_status, 'updatedAt': now_str}
        if new_status == 'RESOLVED':
            updates['resolvedAt'] = now_str
        if extra_fields:
            updates.update(extra_fields)

        if not self.use_fallback and self.db:
            try:
                self.db.collection('complaints').document(complaint_id).update(updates)
                return True
            except Exception as e:
                logger.error(f"Firestore update error: {e}")

        # Fallback
        db_data = self._read_fallback()
        updated = False
        for c in db_data.get('complaints', []):
            if c.get('id') == complaint_id:
                c.update(updates)
                updated = True
                break
        if updated:
            self._write_fallback(db_data)
        return updated

    def update_notification_status(self, complaint_id, sent_status, error_msg=None):
        updates = {
            'telegramNotificationSent': sent_status,
            'notificationAttemptedAt': datetime.now(timezone.utc).isoformat()
        }
        if error_msg:
            updates['telegramNotificationError'] = str(error_msg)
        return self.update_complaint_status(complaint_id, updates.get('status', 'NEW'), updates)

    # --- CAMERAS OPERATIONS ---
    def get_cameras(self):
        if not self.use_fallback and self.db:
            try:
                docs = self.db.collection('cameras').stream()
                return [doc.to_dict() for doc in docs]
            except Exception as e:
                logger.error(f"Firestore get cameras error: {e}")

        db_data = self._read_fallback()
        return db_data.get('cameras', [])

    def get_camera_by_id(self, camera_id):
        cameras = self.get_cameras()
        for cam in cameras:
            if cam.get('id') == camera_id:
                return cam
        return None

    # --- 24-HOUR CLEANUP OPERATIONS ---
    def archive_old_complaints(self, max_age_hours=24):
        now = datetime.now(timezone.utc)
        archived_count = 0

        db_data = self._read_fallback()
        active_complaints = []
        history = db_data.get('history', [])

        for c in db_data.get('complaints', []):
            created_str = c.get('createdAt')
            if created_str:
                try:
                    created_dt = datetime.fromisoformat(created_str.replace('Z', '+00:00'))
                    age_hours = (now - created_dt).total_seconds() / 3600.0
                    if age_hours >= max_age_hours and c.get('status') in ['RESOLVED', 'REJECTED']:
                        history.append(c)
                        archived_count += 1
                        continue
                except Exception as e:
                    logger.warning(f"Timestamp parse error during cleanup: {e}")
            active_complaints.append(c)

        if archived_count > 0:
            db_data['complaints'] = active_complaints
            db_data['history'] = history
            self._write_fallback(db_data)
            logger.info(f"Archived {archived_count} complaints older than {max_age_hours} hours.")

        return archived_count

# Singleton instance
firebase_service = FirebaseService()
