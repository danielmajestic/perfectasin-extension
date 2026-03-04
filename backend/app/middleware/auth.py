"""
Firebase Authentication middleware for FastAPI.
Usage:
    from app.middleware.auth import get_current_user
    @router.get("/protected")
    async def protected(current_user: dict = Depends(get_current_user)):
        uid = current_user["uid"]
"""
import os
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.firebase import firebase_auth

logger = logging.getLogger(__name__)
_bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(_bearer_scheme),
) -> dict:
    # Dev bypass when ENVIRONMENT=development and no valid token
    if os.getenv("ENVIRONMENT") == "development" and (creds is None or creds.credentials in ("", "null", "undefined")):
        logger.info("DEV BYPASS: returning dev user")
        return {"uid": "dev-user", "email": "dev@titleperfect.app"}

    if firebase_auth is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service not configured",
        )
    try:
        decoded = firebase_auth.verify_id_token(creds.credentials)
        return decoded
    except firebase_auth.ExpiredIdTokenError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired",
        )
    except Exception as e:
        logger.warning(f"Token verification failed: {e}")
        # In dev, fall back to dev user instead of 401
        if os.getenv("ENVIRONMENT") == "development":
            logger.info("DEV BYPASS (fallback): returning dev user")
            return {"uid": "dev-user", "email": "dev@titleperfect.app"}
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token",
        )
