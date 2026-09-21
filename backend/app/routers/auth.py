from fastapi import APIRouter, HTTPException

from ..auth import create_access_token
from ..config import get_settings
from ..schemas import LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    settings = get_settings()
    if payload.username not in {settings.admin_username, settings.admin_email} or payload.password != settings.admin_password:
        raise HTTPException(401, "Invalid administrator credentials")
    return TokenResponse(
        access_token=create_access_token(payload.username),
        user={"email": settings.admin_email, "role": "admin"},
    )
