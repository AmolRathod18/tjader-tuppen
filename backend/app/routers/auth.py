import logging

from fastapi import APIRouter, HTTPException
from fastapi import Depends

from ..auth import create_access_token, hash_password, require_admin, verify_password
from ..config import get_settings
from ..repository import insert, rows, update
from ..schemas import AdminUpdate, LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Authentication"])
logger = logging.getLogger(__name__)


@router.post("/login", response_model=TokenResponse)
def login(payload: LoginRequest):
    settings = get_settings()
    try:
        administrators = rows("admins")
    except Exception as error:
        logger.exception("Admin login database lookup failed: %s", error)
        raise HTTPException(503, "Authentication service is unavailable") from error
    administrator = next(
        (
            item for item in administrators
            if payload.username.casefold() in {item["username"].casefold(), item["email"].casefold()}
        ),
        None,
    )
    if administrator is None:
        if payload.username.casefold() not in {settings.admin_username.casefold(), settings.admin_email.casefold()}:
            raise HTTPException(401, "Invalid administrator credentials")
        if payload.password != settings.admin_password:
            raise HTTPException(401, "Invalid administrator credentials")
        administrator = insert("admins", {
            "username": settings.admin_username,
            "email": settings.admin_email,
            "password_hash": hash_password(settings.admin_password),
        })
    elif not verify_password(payload.password, administrator["password_hash"]):
        raise HTTPException(401, "Invalid administrator credentials")
    return TokenResponse(
        access_token=create_access_token(administrator["id"], administrator["username"], administrator["email"]),
        user={"id": administrator["id"], "username": administrator["username"], "email": administrator["email"], "role": "admin"},
    )


@router.get("/me")
def current_admin(admin: dict = Depends(require_admin)):
    administrator = next((item for item in rows("admins") if item["id"] == admin["sub"]), None)
    if administrator is None:
        raise HTTPException(401, "Administrator account no longer exists")
    return {
        "id": administrator["id"],
        "username": administrator["username"],
        "email": administrator["email"],
        "role": "admin",
    }


@router.patch("/me")
def update_admin(payload: AdminUpdate, admin: dict = Depends(require_admin)):
    administrator = next((item for item in rows("admins") if item["id"] == admin["sub"]), None)
    if administrator is None:
        raise HTTPException(401, "Administrator account no longer exists")
    if not verify_password(payload.current_password, administrator["password_hash"]):
        raise HTTPException(400, "Current password is incorrect")

    data = {}
    if payload.username is not None:
        data["username"] = payload.username
    if payload.email is not None:
        data["email"] = str(payload.email)
    if payload.password is not None:
        data["password_hash"] = hash_password(payload.password)
    if not data:
        raise HTTPException(422, "Provide a username, email, or new password")
    updated = update("admins", administrator["id"], data)
    return {
        "id": updated["id"],
        "username": updated["username"],
        "email": updated["email"],
        "role": "admin",
    }
