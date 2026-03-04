"""
User router — profile and usage endpoints.

GET /api/user/profile  — return (or create) user doc
GET /api/user/usage    — current month analysis count
"""
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status

from app.config import get_settings
from app.firebase import db
from app.middleware.auth import get_current_user
from app.models.firestore_schema import UserDoc, UsageDoc

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/user", tags=["user"])


def _current_month() -> str:
    return datetime.utcnow().strftime("%Y-%m")


@router.get("/profile")
async def get_profile(current_user: dict = Depends(get_current_user)):
    """Return user profile from Firestore, creating it if it doesn't exist."""
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not configured",
        )

    uid = current_user["uid"]
    ref = db.collection("users").document(uid)
    snap = ref.get()

    if snap.exists:
        # Update last_login
        ref.update({"last_login": datetime.utcnow()})
        return snap.to_dict()

    # Create new user doc
    user = UserDoc(
        uid=uid,
        email=current_user.get("email", ""),
        display_name=current_user.get("name"),
    )
    ref.set(user.model_dump())
    return user.model_dump()


@router.get("/usage")
async def get_usage(current_user: dict = Depends(get_current_user)):
    """Return current month's analysis count for the authenticated user."""
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not configured",
        )

    uid = current_user["uid"]
    month = _current_month()
    doc_id = f"{uid}_{month}"

    snap = db.collection("usage").document(doc_id).get()
    if snap.exists:
        data = snap.to_dict()
        return {"month": month, "analysis_count": data.get("analysis_count", 0)}

    return {"month": month, "analysis_count": 0}


@router.post("/usage/reset")
async def reset_usage(current_user: dict = Depends(get_current_user)):
    """
    DEV ONLY — Reset current month's analysis count to 0 for the authenticated user.
    Returns 403 in any environment other than 'development'.
    """
    settings = get_settings()
    if settings.ENVIRONMENT != "development":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Usage reset is only available in development environment.",
        )

    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not configured",
        )

    uid = current_user["uid"]
    month = _current_month()
    doc_id = f"{uid}_{month}"
    ref = db.collection("usage").document(doc_id)

    ref.set(
        {"uid": uid, "month": month, "analysis_count": 0, "reset_at": datetime.utcnow()},
        merge=True,
    )

    logger.info(f"[DEV] Usage reset to 0 for uid={uid}, month={month}")

    # Return updated subscription-style object
    user_snap = db.collection("users").document(uid).get()
    tier = "free"
    if user_snap.exists:
        tier = user_snap.to_dict().get("tier", "free")

    from app.config import get_settings as _gs
    free_limit = _gs().FREE_TIER_MONTHLY_LIMIT

    return {
        "uid": uid,
        "month": month,
        "analysis_count": 0,
        "tier": tier,
        "usage_limit": free_limit if tier == "free" else None,
        "reset_at": datetime.utcnow().isoformat(),
    }
