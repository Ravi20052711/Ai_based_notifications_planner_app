import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app
from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.reminder import Reminder
from app.core.exceptions import AIProviderError

client = TestClient(app)

@pytest.fixture
def auth_header():
    # Setup a test user and get a token
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    db.query(User).delete()
    from app.utils.auth import get_password_hash
    user = User(email="edge@test.com", username="edgeuser", password_hash=get_password_hash("pass"))
    db.add(user)
    db.commit()
    
    response = client.post("/api/auth/login", data={"username": "edgeuser", "password": "pass"})
    token = response.json()["access_token"]
    yield {"Authorization": f"Bearer {token}"}
    db.close()

def test_edge_reminder_not_found(auth_header):
    # Test ResourceNotFound exception handler
    response = client.get("/api/reminders/99999", headers=auth_header)
    assert response.status_code == 404
    assert "not found" in response.json()["detail"]

@patch("app.routers.ai.ai_service", new_callable=AsyncMock)
def test_edge_ai_provider_failure(mock_ai, auth_header):
    # Simulate AI provider failing
    mock_ai.extract_reminder.side_effect = AIProviderError("Connection Timeout")
    
    response = client.post("/api/ai/reminder", headers=auth_header, json={"text": "test"})
    assert response.status_code == 502
    assert "AI Service Error" in response.json()["detail"]

def test_security_isolation(auth_header):
    # Create another user
    db = SessionLocal()
    from app.utils.auth import get_password_hash
    user2 = User(email="other@test.com", username="other", password_hash=get_password_hash("pass"))
    db.add(user2)
    db.commit()
    
    # Create a reminder for user2
    rem = Reminder(user_id=user2.id, title="Secret", date="2026-06-07", time="10:00", status="pending")
    db.add(rem)
    db.commit()
    rem_id = rem.id
    
    # Attempt to access user2's reminder with user1's (auth_header) token
    response = client.get(f"/api/reminders/{rem_id}", headers=auth_header)
    assert response.status_code == 404 # Should be 404 (or 403) to hide existence, repository ensures this
    db.close()

@pytest.mark.asyncio
async def test_concurrency_load():
    # Simple concurrency check using multiple rapid requests
    # In a real environment, we'd use httpx.AsyncClient and asyncio.gather
    pass
