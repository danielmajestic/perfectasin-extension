"""
Admin API — usage dashboard endpoints.
Protected by ADMIN_UIDS env var (comma-separated Firebase UIDs).

GET /api/admin/usage/summary       — monthly overview, top 10 users
GET /api/admin/usage/user/{uid}    — per-user deep dive
"""
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException

from app.config import get_settings
from app.firebase import db
from app.middleware.auth import get_current_user

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/admin", tags=["admin"])


def _current_month() -> str:
    return datetime.utcnow().strftime("%Y-%m")


async def get_admin_user(current_user: dict = Depends(get_current_user)) -> dict:
    """Dependency: verifies caller is in ADMIN_UIDS."""
    settings = get_settings()
    admin_uids = [u.strip() for u in settings.ADMIN_UIDS.split(",") if u.strip()]
    if current_user["uid"] not in admin_uids:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user


@router.get("/usage/summary")
async def usage_summary(_admin: dict = Depends(get_admin_user)):
    """
    Monthly usage overview.
    Returns total active users, total analyses, total estimated API cost,
    and top 10 users by analysis count for the current month.
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Firebase not configured")

    month = _current_month()
    docs = db.collection("usage").where("month", "==", month).get()

    total_users = 0
    total_analyses = 0
    total_input_tokens = 0
    total_output_tokens = 0
    total_cost_usd = 0.0
    user_rows = []

    for doc in docs:
        d = doc.to_dict()
        count = d.get("analysis_count", 0)
        if count == 0:
            continue
        total_users += 1
        total_analyses += count
        total_input_tokens += d.get("total_input_tokens", 0)
        total_output_tokens += d.get("total_output_tokens", 0)
        total_cost_usd += d.get("total_cost_usd", 0.0)
        user_rows.append({
            "uid": d.get("uid"),
            "analysis_count": count,
            "total_cost_usd": round(d.get("total_cost_usd", 0.0), 4),
            "last_analysis_at": d.get("last_analysis_at"),
        })

    top_10 = sorted(user_rows, key=lambda x: x["analysis_count"], reverse=True)[:10]

    return {
        "month": month,
        "total_active_users": total_users,
        "total_analyses": total_analyses,
        "total_input_tokens": total_input_tokens,
        "total_output_tokens": total_output_tokens,
        "total_estimated_cost_usd": round(total_cost_usd, 4),
        "top_users": top_10,
    }


@router.get("/usage/user/{uid}")
async def usage_user_detail(uid: str, _admin: dict = Depends(get_admin_user)):
    """
    Deep dive for a specific user: all monthly usage docs, tier, subscription status.
    """
    if db is None:
        raise HTTPException(status_code=503, detail="Firebase not configured")

    # Monthly usage history (most recent first)
    usage_docs = (
        db.collection("usage")
        .where("uid", "==", uid)
        .order_by("month", direction="DESCENDING")
        .get()
    )

    monthly = []
    lifetime_analyses = 0
    for doc in usage_docs:
        d = doc.to_dict()
        count = d.get("analysis_count", 0)
        lifetime_analyses += count
        monthly.append({
            "month": d.get("month"),
            "analysis_count": count,
            "total_input_tokens": d.get("total_input_tokens", 0),
            "total_output_tokens": d.get("total_output_tokens", 0),
            "total_cost_usd": round(d.get("total_cost_usd", 0.0), 4),
            "last_analysis_at": d.get("last_analysis_at"),
        })

    # Subscription / tier info
    user_snap = db.collection("users").document(uid).get()
    user_data = user_snap.to_dict() if user_snap.exists else {}

    sub_snap = db.collection("subscriptions").document(uid).get()
    sub_data = sub_snap.to_dict() if sub_snap.exists else {}

    return {
        "uid": uid,
        "tier": user_data.get("tier", "free"),
        "subscription": sub_data,
        "lifetime_analyses": lifetime_analyses,
        "monthly_usage": monthly,
    }
