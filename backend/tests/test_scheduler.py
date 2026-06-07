import pytest
from unittest.mock import AsyncMock, patch, MagicMock
from app.services.scheduler import check_reminders
from app.models.reminder import Reminder
from app.models.user import User
from datetime import datetime

@pytest.mark.asyncio
@patch("app.services.scheduler.SessionLocal")
@patch("app.services.scheduler.notification_service")
@patch("app.services.scheduler.ai_service", new_callable=AsyncMock)
async def test_check_reminders_none_repeat(mock_ai, mock_notify, mock_session):
    # Setup mock DB
    db = MagicMock()
    mock_session.return_value = db
    
    now = datetime.now()
    current_date = now.strftime("%Y-%m-%d")
    current_time = now.strftime("%H:%M")
    
    user = User(id=1, username="testuser", fcm_token="token123")
    reminder = Reminder(
        id=1, user_id=1, title="Test", date=current_date, 
        time=current_time, status="pending", repeat_type="none"
    )
    
    db.query().filter().all.return_value = [reminder]
    db.query().filter().first.return_value = user
    mock_ai.generate_smart_notification.return_value = "Smart Message"
    
    await check_reminders()
    
    # Assertions
    mock_notify.send_push_notification.assert_called_once_with(
        token="token123", title="Reminder: Test", body="Smart Message"
    )
    assert reminder.status == "completed"
    db.commit.assert_called()

@pytest.mark.asyncio
@patch("app.services.scheduler.SessionLocal")
@patch("app.services.scheduler.notification_service")
@patch("app.services.scheduler.ai_service", new_callable=AsyncMock)
async def test_check_reminders_daily_repeat(mock_ai, mock_notify, mock_session):
    db = MagicMock()
    mock_session.return_value = db
    
    now = datetime.now()
    current_date = now.strftime("%Y-%m-%d")
    current_time = now.strftime("%H:%M")
    
    user = User(id=1, username="testuser", fcm_token="token123")
    reminder = Reminder(
        id=2, user_id=1, title="Daily", date=current_date, 
        time=current_time, status="pending", repeat_type="daily"
    )
    
    db.query().filter().all.return_value = [reminder]
    db.query().filter().first.return_value = user
    mock_ai.generate_smart_notification.return_value = "Daily Smart Message"
    
    await check_reminders()
    
    # Assertions
    assert reminder.status == "pending"
    # Check that date has been updated to tomorrow
    # This is a bit tricky with timezones/date changes during test, but generally should work
    assert reminder.date != current_date
    db.commit.assert_called()
