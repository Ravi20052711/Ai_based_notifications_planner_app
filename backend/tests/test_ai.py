import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app
from app.services.ai_service import ai_service
from app.routers.auth import get_current_user
from app.models.user import User

client = TestClient(app)

# Mock user for authentication
mock_user = User(id=1, username="testuser", email="test@example.com")

def override_get_current_user():
    return mock_user

app.dependency_overrides[get_current_user] = override_get_current_user

@pytest.fixture
def mock_ai_service():
    with patch("app.routers.ai.ai_service", new_callable=AsyncMock) as mock:
        yield mock

def test_ai_extract_reminder(mock_ai_service):
    mock_ai_service.extract_reminder.return_value = {
        "title": "Buy milk",
        "date": "2026-06-08",
        "time": "18:00",
        "repeat_type": "none",
        "priority": "medium",
        "category": "personal"
    }

    response = client.post(
        "/api/ai/reminder",
        json={"text": "remind me to buy milk tomorrow evening"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Buy milk"
    assert data["date"] == "2026-06-08"
    mock_ai_service.extract_reminder.assert_called_once_with("remind me to buy milk tomorrow evening")

def test_ai_generate_plan(mock_ai_service):
    # Mocking DB response for pending tasks is complex with testclient and direct DB access in router
    # For now, let's focus on the AI service call if tasks exist.
    # We might need to mock the DB session too.
    pass

def test_ai_breakdown_goal(mock_ai_service):
    mock_ai_service.breakdown_goal.return_value = {
        "goal": "Learn Python",
        "total_days": 2,
        "tasks": [
            {"day": 1, "title": "Setup", "description": "Install Python", "estimated_minutes": 30},
            {"day": 2, "title": "Basics", "description": "Learn variables", "estimated_minutes": 60}
        ]
    }

    response = client.post(
        "/api/ai/goals?days=2",
        json={"text": "Learn Python"}
    )

    assert response.status_code == 200
    data = response.json()
    assert data["goal"] == "Learn Python"
    assert len(data["tasks"]) == 2
    mock_ai_service.breakdown_goal.assert_called_once_with("Learn Python", 2)

def test_ai_endpoints_require_auth():
    # Remove override to test auth
    del app.dependency_overrides[get_current_user]
    
    response = client.post("/api/ai/reminder", json={"text": "test"})
    assert response.status_code == 401
    
    # Restore override for other tests
    app.dependency_overrides[get_current_user] = override_get_current_user
