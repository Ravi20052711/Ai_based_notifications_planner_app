from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.user import User
from ..models.reminder import Reminder
from ..schemas.user import UserResponse
from ..schemas.reminder import ReminderResponse, ReminderUpdate
from .auth import get_current_user

router = APIRouter(prefix="/api/admin", tags=["admin"])

def check_admin(current_user: User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return current_user

@router.get("/users", response_model=List[UserResponse])
def list_users(
    db: Session = Depends(get_db),
    admin: User = Depends(check_admin)
):
    return db.query(User).all()

@router.get("/reminders", response_model=List[ReminderResponse])
def list_all_reminders(
    db: Session = Depends(get_db),
    admin: User = Depends(check_admin)
):
    return db.query(Reminder).all()

@router.patch("/reminders/{reminder_id}/time", response_model=ReminderResponse)
def force_change_reminder_time(
    reminder_id: int,
    time_update: ReminderUpdate,
    db: Session = Depends(get_db),
    admin: User = Depends(check_admin)
):
    reminder = db.query(Reminder).filter(Reminder.id == reminder_id).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    if time_update.time:
        reminder.time = time_update.time
    if time_update.date:
        reminder.date = time_update.date
        
    db.commit()
    db.refresh(reminder)
    return reminder
