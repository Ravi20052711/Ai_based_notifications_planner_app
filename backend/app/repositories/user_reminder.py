from typing import List, Optional
from sqlalchemy.orm import Session
from .base import BaseRepository
from ..models.user import User
from ..models.reminder import Reminder
from datetime import date, datetime

class UserRepository(BaseRepository[User]):
    def __init__(self, db: Session):
        super().__init__(User, db)

    def get_by_email(self, email: str) -> Optional[User]:
        return self.db.query(User).filter(User.email == email).first()

    def get_by_username(self, username: str) -> Optional[User]:
        return self.db.query(User).filter(User.username == username).first()

class ReminderRepository(BaseRepository[Reminder]):
    def __init__(self, db: Session, user_id: int):
        super().__init__(Reminder, db)
        self.user_id = user_id

    def get_mine(self, id: int) -> Optional[Reminder]:
        return self.db.query(Reminder).filter(
            Reminder.id == id, 
            Reminder.user_id == self.user_id
        ).first()

    def list_mine(self) -> List[Reminder]:
        return self.db.query(Reminder).filter(Reminder.user_id == self.user_id).all()

    def get_today_pending(self) -> List[Reminder]:
        today = date.today().isoformat()
        return self.db.query(Reminder).filter(
            Reminder.user_id == self.user_id,
            Reminder.date == today,
            Reminder.status == "pending"
        ).all()

    def get_due_now(self) -> List[Reminder]:
        now = datetime.now()
        current_date = now.strftime("%Y-%m-%d")
        current_time = now.strftime("%H:%M")
        return self.db.query(Reminder).filter(
            Reminder.user_id == self.user_id,
            Reminder.date == current_date,
            Reminder.time == current_time,
            Reminder.status == "pending"
        ).all()

    def create_mine(self, obj_in: dict) -> Reminder:
        obj_in["user_id"] = self.user_id
        return self.create(obj_in)
