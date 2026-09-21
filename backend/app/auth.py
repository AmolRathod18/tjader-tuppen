from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt

from .config import get_settings

ALGORITHM = "HS256"
bearer = HTTPBearer(auto_error=False)


def create_access_token(subject: str) -> str:
    expires = datetime.now(timezone.utc) + timedelta(hours=12)
    return jwt.encode({"sub": subject, "role": "admin", "exp": expires}, get_settings().jwt_secret, algorithm=ALGORITHM)


def require_admin(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict:
    if not credentials:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    try:
        payload = jwt.decode(credentials.credentials, get_settings().jwt_secret, algorithms=[ALGORITHM])
        if payload.get("role") != "admin" or not payload.get("sub"):
            raise ValueError
        return payload
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
