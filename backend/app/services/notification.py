import firebase_admin
from firebase_admin import credentials, messaging
import logging
import os
from ..config import settings

logger = logging.getLogger(__name__)

class NotificationService:
    def __init__(self):
        self.initialized = False
        if settings.FIREBASE_CREDENTIALS_PATH and os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
            try:
                cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
                firebase_admin.initialize_app(cred)
                self.initialized = True
                logger.info("Firebase Admin SDK initialized.")
            except Exception as e:
                logger.error(f"Failed to initialize Firebase: {e}")
        else:
            logger.warning("Firebase credentials not found. Notifications will be logged only.")

    def send_push_notification(self, token: str, title: str, body: str, data: dict = None):
        if not self.initialized:
            logger.info(f"MOCK NOTIFICATION to {token}: {title} - {body}")
            return

        message = messaging.Message(
            notification=messaging.Notification(
                title=title,
                body=body,
            ),
            data=data or {},
            token=token,
        )

        try:
            response = messaging.send(message)
            logger.info(f"Successfully sent message: {response}")
        except Exception as e:
            logger.error(f"Error sending push notification: {e}")

notification_service = NotificationService()
