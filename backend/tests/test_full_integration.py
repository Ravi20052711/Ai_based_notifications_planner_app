import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app
from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.reminder import Reminder

client = TestClient(app)

@pytest.fixture(scope="module")
def test_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

def test_full_flow(test_db):
    # 1. Register
    reg_response = client.post(
        "/api/auth/register",
        json={"email": "flow@example.com", "username": "flowuser", "password": "password123"}
    )
    assert reg_response.status_code == 200
    
    # 2. Login
    login_response = client.post(
        "/api/auth/login",
        data={"username": "flowuser", "password": "password123"}
    )
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 3. Create Reminder
    rem_response = client.post(
        "/api/reminders/",
        headers=headers,
        json={
            "title": "Integration Task",
            "date": "2026-06-07",
            "time": "12:00",
            "priority": "high",
            "repeat_type": "none"
        }
    )
    assert rem_response.status_code == 200
    reminder_id = rem_response.json()["id"]
    
    # 4. Fetch Today's Reminders
    # We might need to mock current time if we want to be safe, 
    # but the seeded date matches the session context date.
    today_response = client.get("/api/reminders/today", headers=headers)
    assert today_response.status_code == 200
    assert any(r["id"] == reminder_id for r in today_response.json())
    
    # 5. Test AI Reminder Extraction (Mocked)
    with patch("app.routers.ai.ai_service", new_callable=AsyncMock) as mock_ai:
        mock_ai.extract_reminder.return_value = {
            "title": "AI Task",
            "date": "2026-06-08",
            "time": "10:00",
            "priority": "medium",
            "repeat_type": "none",
            "category": "work"
        }
        ai_response = client.post(
            "/api/ai/reminder",
            headers=headers,
            json={"text": "remind me to do AI task tomorrow at 10am"}
        )
        assert ai_response.status_code == 200
        assert ai_response.json()["title"] == "AI Task"

    # 6. Complete Reminder
    comp_response = client.patch(f"/api/reminders/{reminder_id}/complete", headers=headers)
    assert comp_response.status_code == 200
    assert comp_response.json()["status"] == "completed"

    # 7. Delete Reminder
    del_response = client.delete(f"/api/reminders/{reminder_id}", headers=headers)
    assert del_response.status_code == 204
