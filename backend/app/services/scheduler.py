from apscheduler.schedulers.asyncio import AsyncIOScheduler
from datetime import datetime, timedelta
import logging
from ..database import SessionLocal
from ..models.reminder import Reminder
from ..models.user import User
from .notification import notification_service
from .ai_service import ai_service

logger = logging.getLogger(__name__)

async def check_reminders():
    db = SessionLocal()
    try:
        now = datetime.now()
        current_date = now.strftime("%Y-%m-%d")
        current_time = now.strftime("%H:%M")
        
        logger.info(f"CLOCK SYNC: System Time is {current_date} {current_time}. Checking DB...")

        # Catch both exact matches AND any pending tasks from the past that were missed
        due_reminders = db.query(Reminder).filter(
            Reminder.status == "pending",
            (
                (Reminder.date < current_date) | 
                ((Reminder.date == current_date) & (Reminder.time <= current_time))
            )
        ).all()

        if due_reminders:
            logger.info(f"Found {len(due_reminders)} due reminders.")
        else:
            # Check if there are ANY pending reminders at all to verify DB connection
            count = db.query(Reminder).filter(Reminder.status == "pending").count()
            logger.debug(f"No reminders due now. Total pending reminders in DB: {count}")

        for reminder in due_reminders:
            logger.info(f"Processing reminder: {reminder.title} (ID: {reminder.id})")
            user = db.query(User).filter(User.id == reminder.user_id).first()
            
            # Generate smart notification text
            body = reminder.description or "Time for your task!"
            if user:
                body = await ai_service.generate_smart_notification(
                    reminder.title, 
                    reminder.description or "", 
                    user.username
                )

            if user and user.fcm_token:
                notification_service.send_push_notification(
                    token=user.fcm_token,
                    title=f"Reminder: {reminder.title}",
                    body=body
                )
            else:
                logger.info(f"MOCK NOTIFY: {reminder.title} - {body}")
            
            # Handle repeating logic
            if reminder.repeat_type == "none":
                reminder.status = "completed"
            else:
                # Calculate next occurrence
                current_dt = datetime.strptime(reminder.date, "%Y-%m-%d")
                if reminder.repeat_type == "daily":
                    next_dt = current_dt + timedelta(days=1)
                elif reminder.repeat_type == "weekly":
                    next_dt = current_dt + timedelta(weeks=1)
                elif reminder.repeat_type == "weekdays":
                    next_dt = current_dt + timedelta(days=1)
                    while next_dt.weekday() >= 5: # Saturday or Sunday
                        next_dt += timedelta(days=1)
                elif reminder.repeat_type == "monthly":
                    # Simple monthly: add 30 days or handle month rollover
                    # For MVP, +30 days is a common approximation if not using dateutil
                    next_dt = current_dt + timedelta(days=30)
                else:
                    next_dt = current_dt # Should not happen

                reminder.date = next_dt.strftime("%Y-%m-%d")
                # Stay "pending" for the next occurrence
            
            db.commit()
            logger.info(f"Notification processed and reminder {reminder.id} updated.")

    except Exception as e:
        logger.error(f"Error in scheduler job: {e}")
    finally:
        db.close()

class SchedulerService:
    def __init__(self):
        self.scheduler = AsyncIOScheduler()
        self.scheduler.add_job(check_reminders, 'interval', minutes=1)

    def start(self):
        self.scheduler.start()
        logger.info("Async Scheduler started.")

    def shutdown(self):
        self.scheduler.shutdown()
        logger.info("Async Scheduler shut down.")

scheduler_service = SchedulerService()
