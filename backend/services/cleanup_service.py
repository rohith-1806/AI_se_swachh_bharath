import logging
import threading
import time
from services.firebase_service import firebase_service

logger = logging.getLogger(__name__)

class CleanupScheduler:
    def __init__(self, interval_minutes=60, max_age_hours=24):
        self.interval_seconds = interval_minutes * 60
        self.max_age_hours = max_age_hours
        self._thread = None
        self._running = False

    def start(self):
        if self._running:
            return
        self._running = True
        self._thread = threading.Thread(target=self._run_loop, daemon=True)
        self._thread.start()
        logger.info(f"24-Hour Complaint Cleanup Scheduler started (runs every {self.interval_seconds//60} mins).")

    def _run_loop(self):
        while self._running:
            try:
                firebase_service.archive_old_complaints(max_age_hours=self.max_age_hours)
            except Exception as e:
                logger.error(f"Error in 24-hour cleanup job: {e}")
            time.sleep(self.interval_seconds)

    def stop(self):
        self._running = False

cleanup_scheduler = CleanupScheduler()
