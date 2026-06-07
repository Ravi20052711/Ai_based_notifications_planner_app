from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.reminder import Reminder
from ..models.user import User
from ..schemas.reminder import ReminderCreate, ReminderResponse, ReminderUpdate
from .auth import get_current_user
from datetime import date, datetime
from ..services.redis_service import redis_service

router = APIRouter(prefix="/api/reminders", tags=["reminders"])

@router.post("/", response_model=ReminderResponse)
def create_reminder(
    reminder_in: ReminderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    new_reminder = Reminder(
        **reminder_in.model_dump(),
        user_id=current_user.id
    )
    db.add(new_reminder)
    db.commit()
    db.refresh(new_reminder)
    redis_service.delete_cache(f"todays_tasks:{current_user.id}")
    return new_reminder

@router.get("/", response_model=List[ReminderResponse])
def list_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return db.query(Reminder).filter(Reminder.user_id == current_user.id).all()

@router.get("/today", response_model=List[ReminderResponse])
def get_today_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    cache_key = f"todays_tasks:{current_user.id}"
    cached_data = redis_service.get_cache(cache_key)
    if cached_data:
        return cached_data

    today = date.today().isoformat()
    reminders = db.query(Reminder).filter(
        Reminder.user_id == current_user.id,
        Reminder.date == today,
        Reminder.status == "pending"
    ).all()
    
    task_list = [ReminderResponse.model_validate(r).model_dump() for r in reminders]
    redis_service.set_cache(cache_key, task_list)
    
    return reminders

@router.get("/due-now", response_model=List[ReminderResponse])
def get_due_reminders(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    now = datetime.now()
    current_date = now.strftime("%Y-%m-%d")
    current_time = now.strftime("%H:%M")
    
    reminders = db.query(Reminder).filter(
        Reminder.user_id == current_user.id,
        Reminder.status == "pending",
        (
            (Reminder.date < current_date) | 
            ((Reminder.date == current_date) & (Reminder.time <= current_time))
        )
    ).all()
    
    return reminders

@router.get("/{reminder_id}", response_model=ReminderResponse)
def get_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    return reminder

@router.put("/{reminder_id}", response_model=ReminderResponse)
def update_reminder(
    reminder_id: int,
    reminder_in: ReminderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    update_data = reminder_in.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(reminder, field, value)
    
    db.commit()
    db.refresh(reminder)
    return reminder

@router.patch("/{reminder_id}/complete", response_model=ReminderResponse)
def complete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    reminder.status = "completed"
    db.commit()
    db.refresh(reminder)
    redis_service.delete_cache(f"todays_tasks:{current_user.id}")
    return reminder

@router.delete("/{reminder_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_reminder(
    reminder_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reminder = db.query(Reminder).filter(
        Reminder.id == reminder_id,
        Reminder.user_id == current_user.id
    ).first()
    if not reminder:
        raise HTTPException(status_code=404, detail="Reminder not found")
    
    db.delete(reminder)
    db.commit()
    redis_service.delete_cache(f"todays_tasks:{current_user.id}")
    return None
