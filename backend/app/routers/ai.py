from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from ..database import get_db
from ..models.reminder import Reminder
from ..models.user import User
from ..schemas.ai import AIReminderExtraction, DailyPlanResponse, GoalBreakdownResponse, AIRequest
from .auth import get_current_user
from ..services.ai_service import ai_service
from ..repositories.user_reminder import ReminderRepository

router = APIRouter(prefix="/api/ai", tags=["ai"])

@router.post("/reminder", response_model=AIReminderExtraction)
async def extract_reminder(request: AIRequest, current_user: User = Depends(get_current_user)):
    # Global exception handler will catch AIProviderError from ai_service
    return await ai_service.extract_reminder(request.text)

@router.post("/plan", response_model=DailyPlanResponse)
async def generate_plan(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    repo = ReminderRepository(db, current_user.id)
    reminders = repo.get_today_pending()
    
    if not reminders:
        return DailyPlanResponse(
            plan=[],
            summary="You have no pending tasks for today. A perfect time to relax or plan ahead!"
        )
    
    # Convert to dicts for AI service
    tasks = [{"title": r.title, "priority": r.priority, "description": r.description} for r in reminders]
    return await ai_service.generate_daily_plan(tasks)

@router.post("/goals", response_model=GoalBreakdownResponse)
async def breakdown_goal(
    request: AIRequest,
    days: int = 7,
    current_user: User = Depends(get_current_user)
):
    return await ai_service.breakdown_goal(request.text, days)
