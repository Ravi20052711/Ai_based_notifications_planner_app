from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..schemas.user import UserResponse
from .auth import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/api/users", tags=["users"])

class TokenUpdate(BaseModel):
    fcm_token: str

@router.patch("/me/fcm-token")
def update_fcm_token(
    token_in: TokenUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    current_user.fcm_token = token_in.fcm_token
    db.commit()
    return {"message": "FCM token updated successfully"}

@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
