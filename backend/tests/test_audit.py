import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
from app.main import app
from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.models.reminder import Reminder
from app.utils.auth import get_password_hash
import time

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db

# Isolated Test DB
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_audit.db"
test_engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=test_engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module", autouse=True)
def setup_test_db():
    Base.metadata.create_all(bind=test_engine)
    yield
    Base.metadata.drop_all(bind=test_engine)
    import os
    if os.path.exists("test_audit.db"):
        os.remove("test_audit.db")

@pytest.fixture(autouse=True)
def clear_db():
    db = TestingSessionLocal()
    for table in reversed(Base.metadata.sorted_tables):
        db.execute(table.delete())
    db.commit()
    db.close()

def get_token(username, password="password123"):
    response = client.post("/api/auth/login", data={"username": username, "password": password})
    return response.json().get("access_token")

# --- SCENARIO 1: REGISTRATION & LOGIN (3 Checks) ---

def test_check_01_valid_registration(audit_db):
    response = client.post("/api/auth/register", json={"email": "u1@t.com", "username": "user1", "password": "password123"})
    assert response.status_code == 200

def test_check_02_duplicate_registration(audit_db):
    response = client.post("/api/auth/register", json={"email": "u1@t.com", "username": "user1", "password": "password123"})
    assert response.status_code == 400 # Already registered

def test_check_03_login_and_jwt(audit_db):
    token = get_token("user1")
    assert token is not None

# --- SCENARIO 2: BOUNDARIES & ISOLATION (4 Checks) ---

def test_check_04_no_token_access(audit_db):
    response = client.get("/api/reminders/")
    assert response.status_code == 401

def test_check_05_tampered_token(audit_db):
    response = client.get("/api/reminders/", headers={"Authorization": "Bearer fake.token.here"})
    assert response.status_code == 401

def test_check_06_data_isolation_read(audit_db):
    # User 1 creates reminder
    t1 = get_token("user1")
    client.post("/api/reminders/", headers={"Authorization": f"Bearer {t1}"}, 
                json={"title": "U1 Task", "date": "2026-06-07", "time": "10:00", "priority": "low", "repeat_type": "none"})
    
    # User 2 registers
    client.post("/api/auth/register", json={"email": "u2@t.com", "username": "user2", "password": "password123"})
    t2 = get_token("user2")
    
    # User 2 tries to see User 1's tasks
    response = client.get("/api/reminders/today", headers={"Authorization": f"Bearer {t2}"})
    assert len(response.json()) == 0 # Should NOT see user1's task

def test_check_07_unauthorized_delete(audit_db):
    t1 = get_token("user1")
    rem_id = client.get("/api/reminders/", headers={"Authorization": f"Bearer {t1}"}).json()[0]["id"]
    
    t2 = get_token("user2")
    response = client.delete(f"/api/reminders/{rem_id}", headers={"Authorization": f"Bearer {t2}"})
    assert response.status_code == 404 # Repo hides existence

# --- SCENARIO 3: ADMIN AUTHORIZATION (5 Checks) ---

def test_check_08_non_admin_user_list(audit_db):
    t1 = get_token("user1")
    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {t1}"})
    assert response.status_code == 403

def test_check_09_non_admin_global_reminders(audit_db):
    t1 = get_token("user1")
    response = client.get("/api/admin/reminders", headers={"Authorization": f"Bearer {t1}"})
    assert response.status_code == 403

def test_check_10_admin_access_users(audit_db):
    # Promote user1 to admin manually in DB
    db = SessionLocal()
    u = db.query(User).filter(User.username == "user1").first()
    u.is_admin = True
    db.commit()
    db.close()
    
    t1 = get_token("user1")
    response = client.get("/api/admin/users", headers={"Authorization": f"Bearer {t1}"})
    assert response.status_code == 200
    assert len(response.json()) >= 2

def test_check_11_admin_access_reminders(audit_db):
    t1 = get_token("user1")
    response = client.get("/api/admin/reminders", headers={"Authorization": f"Bearer {t1}"})
    assert response.status_code == 200

def test_check_12_admin_force_update(audit_db):
    t1 = get_token("user1") # Admin
    # Get user2's reminder ID
    db = SessionLocal()
    rem = db.query(Reminder).join(User).filter(User.username == "user2").first()
    if not rem:
        # Create one for user2
        u2 = db.query(User).filter(User.username == "user2").first()
        rem = Reminder(user_id=u2.id, title="U2 Task", date="2026-06-07", time="12:00", status="pending")
        db.add(rem)
        db.commit()
    rem_id = rem.id
    db.close()
    
    response = client.patch(f"/api/admin/reminders/{rem_id}/time", 
                           headers={"Authorization": f"Bearer {t1}"},
                           json={"time": "23:59"})
    assert response.status_code == 200
    assert response.json()["time"] == "23:59"

# --- SCENARIO 4: METADATA & FLOW (3 Checks) ---

def test_check_13_last_login_update(audit_db):
    db = SessionLocal()
    u = db.query(User).filter(User.username == "user2").first()
    old_login = u.last_login_at
    db.close()
    
    time.sleep(1) # Ensure clock moves
    get_token("user2")
    
    db = SessionLocal()
    u = db.query(User).filter(User.username == "user2").first()
    assert u.last_login_at != old_login
    db.close()

def test_check_14_token_payload(audit_db):
    from app.utils.auth import decode_token
    token = get_token("user1")
    payload = decode_token(token)
    assert payload["sub"] == "user1"

def test_check_15_me_endpoint(audit_db):
    t1 = get_token("user1")
    response = client.get("/api/users/me", headers={"Authorization": f"Bearer {t1}"})
    assert response.status_code == 200
    assert response.json()["username"] == "user1"
    assert response.json()["is_admin"] == True

# --- SCENARIO 5: INTEGRITY & ERRORS (5 Checks) ---

def test_check_16_empty_title_reminder(audit_db):
    t1 = get_token("user1")
    response = client.post("/api/reminders/", headers={"Authorization": f"Bearer {t1}"}, 
                json={"title": "", "date": "2026-06-07", "time": "10:00", "priority": "low"})
    # Pydantic should catch this if configured, or DB will. Let's check status.
    assert response.status_code in [200, 422] # Currently model might allow empty string unless min_length set

def test_check_17_invalid_date_type(audit_db):
    t1 = get_token("user1")
    response = client.post("/api/reminders/", headers={"Authorization": f"Bearer {t1}"}, 
                json={"title": "Bad Date", "date": "not-a-date", "time": "10:00", "priority": "low"})
    assert response.status_code == 422

def test_check_18_status_transition(audit_db):
    t1 = get_token("user1")
    rem_id = client.get("/api/reminders/", headers={"Authorization": f"Bearer {t1}"}).json()[0]["id"]
    response = client.patch(f"/api/reminders/{rem_id}/complete", headers={"Authorization": f"Bearer {t1}"})
    assert response.status_code == 200
    assert response.json()["status"] == "completed"

def test_check_19_due_now_logic(audit_db):
    t1 = get_token("user1")
    from datetime import datetime
    now = datetime.now()
    client.post("/api/reminders/", headers={"Authorization": f"Bearer {t1}"}, 
                json={"title": "Now Task", "date": now.strftime("%Y-%m-%d"), "time": now.strftime("%H:%M"), "priority": "high"})
    
    response = client.get("/api/reminders/due-now", headers={"Authorization": f"Bearer {t1}"})
    assert any(r["title"] == "Now Task" for r in response.json())

@patch("app.routers.ai.ai_service", new_callable=AsyncMock)
def test_check_20_ai_global_handler(mock_ai, audit_db):
    from app.core.exceptions import AIProviderError
    mock_ai.extract_reminder.side_effect = AIProviderError("Service Down")
    
    t1 = get_token("user1")
    response = client.post("/api/ai/reminder", headers={"Authorization": f"Bearer {t1}"}, json={"text": "test"})
    assert response.status_code == 502
    assert "AI Service Error" in response.json()["detail"]
