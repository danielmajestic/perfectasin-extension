"""
Shared usage tracking utilities — single source of truth for rate limiting.

All five analysis endpoints import from here to guarantee identical counter
reads, limit enforcement, and logging across title / bullets / description /
hero / price endpoints.
"""
import logging
from datetime import datetime

from fastapi import HTTPException

from app.firebase import db

logger = logging.getLogger(__name__)

# Tier limits — canonical definition used by all endpoints + checkout
TIER_LIMITS: dict[str, dict[str, int]] = {
    "free":       {"asins": 3,      "analyses": 5},
    "owner":      {"asins": 50,     "analyses": 200},
    "pro":        {"asins": 50,     "analyses": 200},  # legacy alias for owner
    "consultant": {"asins": 150,    "analyses": 600},
    "agency":     {"asins": 999999, "analyses": 999999},
}


def current_month() -> str:
    return datetime.utcnow().strftime("%Y-%m")


def get_user_tier(uid: str) -> str:
    """Return user's tier from Firestore users doc. Defaults to 'free'."""
    if db is None:
        return "free"
    snap = db.collection("users").document(uid).get()
    if snap.exists:
        return snap.to_dict().get("tier", "free")
    return "free"


def get_usage(uid: str) -> int:
    """Return current month's analysesUsed count for uid. Returns 0 if no doc."""
    if db is None:
        return 0
    doc_id = f"{uid}_{current_month()}"
    snap = db.collection("usage").document(doc_id).get()
    if snap.exists:
        d = snap.to_dict()
        return d.get("analysesUsed", d.get("analysis_count", 0))
    return 0


def check_rate_limit(uid: str, tier: str) -> int:
    """
    Verify uid has analyses remaining for this month.
    Raises HTTP 429 if at or over the limit for their tier.
    Logs current count vs limit so we can diagnose issues without Firestore access.
    Returns the current analysesUsed count (callers need it for is_first_pro logic).
    """
    if db is None:
        return 0

    limits = TIER_LIMITS.get(tier, TIER_LIMITS["free"])
    analysis_limit = limits["analyses"]
    usage_count = get_usage(uid)

    logger.info(
        f"[RATE_LIMIT] uid={uid} tier={tier} "
        f"analysesUsed={usage_count}/{analysis_limit} "
        f"remaining={max(0, analysis_limit - usage_count)}"
    )

    if usage_count >= analysis_limit:
        now = datetime.utcnow()
        reset_date = (
            f"{now.year + 1}-01-01"
            if now.month == 12
            else f"{now.year}-{now.month + 1:02d}-01"
        )
        raise HTTPException(
            status_code=429,
            detail={
                "error": "limit_exceeded",
                "limit_type": "analyses",
                "current": usage_count,
                "limit": analysis_limit,
                "remaining": 0,
                "tier": tier,
                "reset_date": reset_date,
                "message": (
                    f"You've used all {analysis_limit} analyses this month. "
                    "Your limit resets on the 1st of each month."
                ),
            },
        )

    return usage_count


def increment_usage(
    uid: str,
    asin: str | None = None,
    token_data: dict | None = None,
) -> int:
    """
    Increment analysesUsed in the current-month usage doc.
    Logs uid + analysesUsed BEFORE and AFTER the Firestore write.
    If asin is provided, adds it to uniqueAsins when not already present.
    Returns the new analysesUsed count.
    """
    if db is None:
        return 0

    month = current_month()
    doc_id = f"{uid}_{month}"
    ref = db.collection("usage").document(doc_id)
    snap = ref.get()
    now = datetime.utcnow()

    td = token_data or {}
    in_tok = td.get("input_tokens", 0)
    out_tok = td.get("output_tokens", 0)
    cost = td.get("estimated_cost_usd", 0.0)

    if snap.exists:
        d = snap.to_dict()
        existing = d.get("analysesUsed", d.get("analysis_count", 0))
        new_count = existing + 1

        logger.info(
            f"[INCREMENT_USAGE] uid={uid} analysesUsed BEFORE={existing} AFTER={new_count}"
        )

        update_data: dict = {
            "analysesUsed": new_count,
            "analysis_count": new_count,  # keep legacy field in sync
            "last_analysis_at": now,
            "total_input_tokens": d.get("total_input_tokens", 0) + in_tok,
            "total_output_tokens": d.get("total_output_tokens", 0) + out_tok,
            "total_cost_usd": round(d.get("total_cost_usd", 0.0) + cost, 6),
        }
        if asin is not None:
            existing_asins: list = d.get("uniqueAsins", [])
            if asin not in existing_asins:
                update_data["uniqueAsins"] = existing_asins + [asin]
        ref.update(update_data)
        return new_count
    else:
        logger.info(
            f"[INCREMENT_USAGE] uid={uid} first usage doc — BEFORE=0 AFTER=1"
        )
        set_data: dict = {
            "uid": uid,
            "month": month,
            "analysesUsed": 1,
            "analysis_count": 1,
            "last_analysis_at": now,
            "total_input_tokens": in_tok,
            "total_output_tokens": out_tok,
            "total_cost_usd": round(cost, 6),
        }
        if asin is not None:
            set_data["uniqueAsins"] = [asin]
        ref.set(set_data)
        return 1
