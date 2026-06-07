import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import Base, engine, SessionLocal
from app.models.user import User
from app.utils.auth import get_password_hash

client = TestClient(app)

@pytest.fixture
def db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    # Clean up and seed
    db.query(User).delete()
    user = User(email="test@example.com", username="testuser", password_hash=get_password_hash("password123"))
    db.add(user)
    db.commit()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

def test_login_success(db):
    # Test with form data (x-www-form-urlencoded)
    response = client.post(
        "/api/auth/login",
        data={"username": "testuser", "password": "password123"}
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_login_invalid_credentials(db):
    response = client.post(
        "/api/auth/login",
        data={"username": "testuser", "password": "wrongpassword"}
    )
    assert response.status_code == 401

def test_login_wrong_format(db):
    # Sending JSON instead of form data should fail with 422
    response = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "password123"}
    )
    assert response.status_code == 422
