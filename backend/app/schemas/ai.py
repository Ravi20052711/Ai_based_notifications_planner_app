from pydantic import BaseModel, Field
from typing import List, Optional

class AIReminderExtraction(BaseModel):
    title: str = Field(..., description="Short descriptive title of the task")
    date: str = Field(..., description="Target date in YYYY-MM-DD format")
    time: str = Field(..., description="Target time in 24h HH:MM format")
    repeat_type: str = Field("none", description="One of: none, daily, weekly, weekdays, monthly")
    priority: str = Field("medium", description="One of: low, medium, high")
    category: str = Field("general", description="Contextual category (e.g., work, personal, health)")

class DailyPlanItem(BaseModel):
    time: str = Field(..., description="Suggested start time HH:MM")
    title: str = Field(..., description="Task title")
    duration_minutes: int = Field(..., description="Estimated duration")
    priority: str = Field(..., description="Priority level")

class DailyPlanResponse(BaseModel):
    plan: List[DailyPlanItem]
    summary: str = Field(..., description="Brief AI summary of the day")

class GoalSubTask(BaseModel):
    day: int = Field(..., description="Day number in the sequence")
    title: str = Field(..., description="Specific actionable task")
    description: str = Field(..., description="Detailed instructions")
    estimated_minutes: int = Field(..., description="Time to complete")

class GoalBreakdownResponse(BaseModel):
    goal: str
    total_days: int
    tasks: List[GoalSubTask]

class AIRequest(BaseModel):
    text: str
