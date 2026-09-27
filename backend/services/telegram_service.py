import os
import logging
import requests
from config import Config

logger = logging.getLogger(__name__)

# In-memory set of complaint IDs that have already been notified to avoid duplicate notifications
NOTIFIED_COMPLAINTS = set()

class TelegramService:
    def get_token(self):
        token = os.getenv('TELEGRAM_BOT_TOKEN') or Config.TELEGRAM_BOT_TOKEN
        return token.strip() if token else ''

    def get_chat_id(self):
        chat_id = os.getenv('TELEGRAM_ADMIN_CHAT_ID') or Config.TELEGRAM_ADMIN_CHAT_ID
        return str(chat_id).strip() if chat_id else ''

    def is_configured(self):
        """
        Checks if bot token and admin chat ID are properly set.
        Does NOT log or return secrets.
        """
        token = self.get_token()
        chat_id = self.get_chat_id()
        return bool(token and chat_id)

    def _get_masked_token(self):
        token = self.get_token()
        if not token or len(token) < 8:
            return "[NOT_CONFIGURED]"
        return f"{token[:4]}...{token[-4:]}"

    def send_complaint_notification(self, complaint_data, evidence_file_path=None):
        """
        Sends a Telegram notification to municipal admin.
        Supports both USER citizen reports and CCTV automated incidents.
        Handles duplicate prevention, invalid tokens, timeouts, and image attachments safely.
        NEVER raises unhandled exceptions or causes complaint deletion.
        """
        complaint_id = complaint_data.get('id', 'UNKNOWN')

        # Prevent duplicate notifications for the same complaint ID
        if complaint_id in NOTIFIED_COMPLAINTS:
            logger.info(f"Telegram notification skipped for complaint #{complaint_id}: Duplicate alert prevented.")
            return True, "Duplicate alert skipped"

        logger.info(f"Sending Telegram notification for complaint #{complaint_id}")

        if not self.is_configured():
            err_msg = "TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID missing in backend configuration"
            logger.warning(f"Telegram notification failed: {err_msg}")
            return False, err_msg

        token = self.get_token()
        chat_id = self.get_chat_id()

        try:
            source = complaint_data.get('source', 'USER')
            waste_type = complaint_data.get('wasteType', 'Mixed Waste')
            severity = complaint_data.get('severity', 'HIGH')
            confidence = complaint_data.get('aiConfidence', 0.0)
            status = complaint_data.get('status', 'NEW')
            conf_pct = f"{int(confidence * 100)}%" if isinstance(confidence, (int, float)) else str(confidence)

            lat = complaint_data.get('latitude')
            lng = complaint_data.get('longitude')
            address = complaint_data.get('address', 'Location details unavailable')

            if lat is not None and lng is not None:
                maps_link = f"https://www.google.com/maps?q={lat},{lng}"
            else:
                maps_link = "Coordinates unavailable"

            created_at = complaint_data.get('createdAt', '')

            if source == 'CCTV':
                camera_id = complaint_data.get('cameraId', 'CAM-001')
                camera_name = complaint_data.get('cameraName', f"Camera {camera_id}")
                message = (
                    f"====================================\n"
                    f"[GARBAGE INCIDENT DETECTED - CCTV]\n"
                    f"====================================\n\n"
                    f"Complaint ID: #{complaint_id}\n"
                    f"Source: CCTV\n"
                    f"Camera ID: {camera_id}\n"
                    f"Camera Name: {camera_name}\n"
                    f"Camera Location: {address}\n"
                    f"Waste Type: {waste_type}\n"
                    f"Severity: {severity}\n"
                    f"AI Confidence: {conf_pct}\n"
                    f"Latitude: {lat}\n"
                    f"Longitude: {lng}\n"
                    f"Google Maps Link: {maps_link}\n"
                    f"Timestamp: {created_at}\n"
                    f"Current Status: {status}\n\n"
                    f"Action Required: Dispatch municipal cleaning team."
                )
            else:
                reporter_name = complaint_data.get('reporterName', 'Anonymous Citizen')
                reporter_phone = complaint_data.get('reporterPhone', 'Not Provided')
                description = complaint_data.get('description', 'No description provided')
                cleanliness = complaint_data.get('cleanlinessScore', 'N/A')
                clean_str = f"{cleanliness}%" if cleanliness != 'N/A' else "N/A"

                message = (
                    f"====================================\n"
                    f"[NEW GARBAGE COMPLAINT - USER REPORT]\n"
                    f"====================================\n\n"
                    f"Complaint ID: #{complaint_id}\n"
                    f"Source: USER\n"
                    f"Reporter Name: {reporter_name}\n"
                    f"Reporter Phone: {reporter_phone}\n"
                    f"Description: {description}\n"
                    f"Waste Type: {waste_type}\n"
                    f"Severity: {severity}\n"
                    f"AI Confidence: {conf_pct}\n"
                    f"Cleanliness Score: {clean_str}\n"
                    f"Latitude: {lat}\n"
                    f"Longitude: {lng}\n"
                    f"Google Maps Link: {maps_link}\n"
                    f"Date/Time: {created_at}\n"
                    f"Current Status: {status}\n\n"
                    f"Action Required: Assign sanitation response team."
                )

            # Determine whether to send photo or text message
            success, err = False, None
            if evidence_file_path and os.path.isfile(evidence_file_path):
                success, err = self._send_photo(token, chat_id, message, evidence_file_path)
            else:
                success, err = self._send_message(token, chat_id, message)

            if success:
                NOTIFIED_COMPLAINTS.add(complaint_id)
                logger.info("Telegram notification sent successfully")
            else:
                logger.warning(f"Telegram notification failed: {err}")

            return success, err

        except Exception as e:
            safe_err = str(e)
            logger.error(f"Telegram notification failed: {safe_err}")
            return False, safe_err

    def test_telegram_connection(self):
        """
        Diagnostic method to test Telegram API integration independently.
        Returns (success: bool, message: str)
        """
        if not self.is_configured():
            return False, "TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID is missing in backend environment."

        token = self.get_token()
        chat_id = self.get_chat_id()

        test_msg = (
            f"[AI SE SWACHH BHARAT - TELEGRAM DIAGNOSTIC TEST]\n\n"

            f"Telegram Integration Status: Operational\n"
            f"Admin Chat ID: {chat_id}\n"
            f"Bot Token Mask: {self._get_masked_token()}\n"
            f"System: Swachh Bharat Municipal AI Platform"
        )
        return self._send_message(token, chat_id, test_msg)

    def _send_message(self, token, chat_id, text):
        url = f"https://api.telegram.org/bot{token}/sendMessage"
        payload = {
            'chat_id': chat_id,
            'text': text,
            'disable_web_page_preview': False
        }
        try:
            resp = requests.post(url, json=payload, timeout=10)
            data = resp.json()
            if resp.status_code == 200 and data.get('ok'):
                return True, None
            else:
                err_desc = data.get('description', f"HTTP {resp.status_code}")
                return False, err_desc
        except Exception as e:
            return False, str(e)

    def _send_photo(self, token, chat_id, caption, photo_path):
        url = f"https://api.telegram.org/bot{token}/sendPhoto"
        data = {
            'chat_id': chat_id,
            'caption': caption[:1024]  # Telegram photo caption max 1024 chars
        }
        try:
            with open(photo_path, 'rb') as photo_file:
                files = {'photo': photo_file}
                resp = requests.post(url, data=data, files=files, timeout=15)
                res_json = resp.json()
                if resp.status_code == 200 and res_json.get('ok'):
                    return True, None
                else:
                    err_desc = res_json.get('description', f"HTTP {resp.status_code}")
                    logger.warning(f"sendPhoto failed ({err_desc}). Retrying as text message...")
                    return self._send_message(token, chat_id, caption)
        except Exception as e:
            logger.warning(f"sendPhoto failed exception ({e}). Falling back to text message...")
            return self._send_message(token, chat_id, caption)

telegram_service = TelegramService()
