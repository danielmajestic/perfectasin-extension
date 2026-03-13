"""
Auth router — email/password and Google sign-in endpoints.
POST /api/auth/login   — email/password sign-in via Firebase REST API
POST /api/auth/google  — Google access_token exchange
"""
import logging
import httpx
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from app.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/auth", tags=["auth"])

FIREBASE_API_KEY = "AIzaSyD9bhupwn_19wSDYDdoaPYAfbOCzBN-TFQ"
FIREBASE_SIGNIN_URL = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={FIREBASE_API_KEY}"
FIREBASE_CUSTOM_TOKEN_URL = f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key={FIREBASE_API_KEY}"
GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


class EmailLoginRequest(BaseModel):
    email: str
    password: str


class GoogleLoginRequest(BaseModel):
    access_token: str


@router.post("/login")
async def login_with_email(req: EmailLoginRequest):
    """Sign in with email/password via Firebase Auth REST API."""
    async with httpx.AsyncClient() as client:
        resp = await client.post(FIREBASE_SIGNIN_URL, json={
            "email": req.email,
            "password": req.password,
            "returnSecureToken": True,
        })

    data = resp.json()

    if resp.status_code != 200:
        msg = data.get("error", {}).get("message", "Authentication failed")
        logger.warning(f"Email login failed for {req.email}: {msg}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=msg,
        )

    return {
        "token": data["idToken"],
        "uid": data["localId"],
        "email": data["email"],
        "refresh_token": data.get("refreshToken"),
        "expires_in": data.get("expiresIn"),
    }


@router.post("/google")
async def login_with_google(req: GoogleLoginRequest):
    """Exchange Google access_token for Firebase ID token."""
    import firebase_admin.auth as fb_auth

    # Step 1: Get user info from Google
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {req.access_token}"},
        )

    if resp.status_code != 200:
        logger.warning(f"Google userinfo failed: {resp.status_code}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid Google token",
        )

    google_info = resp.json()
    google_email = google_info.get("email")
    google_name = google_info.get("name")
    google_id = google_info.get("id")

    if not google_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not retrieve email from Google",
        )

    # Step 2: Find or create Firebase user
    try:
        fb_user = fb_auth.get_user_by_email(google_email)
    except fb_auth.UserNotFoundError:
        fb_user = fb_auth.create_user(
            email=google_email,
            display_name=google_name,
            email_verified=True,
        )
        logger.info(f"Created Firebase user for Google account: {google_email}")

    # Step 3: Create custom token, then exchange for ID token
    custom_token = fb_auth.create_custom_token(fb_user.uid)

    async with httpx.AsyncClient() as client:
        resp = await client.post(FIREBASE_CUSTOM_TOKEN_URL, json={
            "token": custom_token.decode() if isinstance(custom_token, bytes) else custom_token,
            "returnSecureToken": True,
        })

    if resp.status_code != 200:
        logger.error(f"Custom token exchange failed: {resp.json()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token exchange failed",
        )

    token_data = resp.json()

    return {
        "token": token_data["idToken"],
        "uid": fb_user.uid,
        "email": google_email,
    }
