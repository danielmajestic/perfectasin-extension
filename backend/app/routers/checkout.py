"""
Checkout router — Stripe Checkout and Customer Portal sessions.

POST /api/checkout/create-session        — create Stripe Checkout session
POST /api/checkout/create-portal-session — create Customer Portal session
GET  /api/user/subscription              — return subscription status
"""
import logging
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, model_validator

from app.config import get_settings
from app.firebase import db
from app.middleware.auth import get_current_user
from app.services.usage import TIER_LIMITS
from app.stripe_config import stripe

logger = logging.getLogger(__name__)
router = APIRouter(tags=["checkout"])

TIER_METADATA = {
    "owner":      {"asin_limit": 50,  "analysis_limit": 200},
    "consultant": {"asin_limit": 150, "analysis_limit": 600},
}


def _get_price_id(tier: str, annual: bool) -> str:
    """Resolve Stripe price ID from tier + billing period using env vars."""
    settings = get_settings()
    mapping = {
        ("owner",      False): settings.STRIPE_OWNER_MONTHLY_PRICE_ID,
        ("owner",      True):  settings.STRIPE_OWNER_ANNUAL_PRICE_ID,
        ("consultant", False): settings.STRIPE_CONSULTANT_MONTHLY_PRICE_ID,
        ("consultant", True):  settings.STRIPE_CONSULTANT_ANNUAL_PRICE_ID,
    }
    price_id = mapping.get((tier, annual))
    if not price_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe price ID not configured for tier='{tier}' annual={annual}. "
                   "Check server environment variables.",
        )
    return price_id


def _require_stripe():
    if stripe is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Payment service not configured",
        )


def _require_db():
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not configured",
        )


def _get_or_create_stripe_customer(uid: str, email: str) -> str:
    """
    Return existing stripeCustomerId from Firestore user doc,
    or create a new Stripe Customer and save the ID.
    """
    ref = db.collection("users").document(uid)
    snap = ref.get()

    if snap.exists:
        data = snap.to_dict()
        cust_id = data.get("stripe_customer_id")
        if cust_id:
            return cust_id

    # Create new Stripe Customer
    customer = stripe.Customer.create(
        email=email,
        metadata={"firebase_uid": uid},
    )
    ref.set({"stripe_customer_id": customer.id}, merge=True)
    return customer.id


# -- Request models ----------------------------------------------------------

class CreateSessionRequest(BaseModel):
    # Frontend sends `plan` ("owner_monthly" | "owner_annual" | "consultant_monthly" | "consultant_annual")
    # Legacy callers may send `tier` ("owner" | "consultant") + `annual` (bool)
    plan: Optional[str] = None
    tier: Optional[str] = None
    annual: bool = False
    price_id: Optional[str] = None  # ignored — price derived server-side from env vars
    success_url: str
    cancel_url: str

    @model_validator(mode="after")
    def resolve_tier_and_annual(self) -> "CreateSessionRequest":
        """Parse plan string into tier + annual, or validate that tier is provided."""
        if self.plan:
            # "owner_monthly" → tier="owner", annual=False
            # "consultant_annual" → tier="consultant", annual=True
            parts = self.plan.rsplit("_", 1)
            if len(parts) == 2 and parts[1] in ("monthly", "annual"):
                self.tier = parts[0]
                self.annual = parts[1] == "annual"
            else:
                # plan doesn't match expected format — treat it as tier name
                self.tier = self.plan
        if not self.tier:
            raise ValueError("Either 'plan' or 'tier' must be provided")
        return self


class CreatePortalRequest(BaseModel):
    return_url: str


# -- Endpoints ---------------------------------------------------------------

@router.post("/api/checkout/create-session")
async def create_checkout_session(
    body: CreateSessionRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a Stripe Checkout Session with 7-day free trial."""
    _require_stripe()
    _require_db()

    tier = body.tier
    if tier not in ("owner", "consultant"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid tier: '{tier}'. Must be 'owner' or 'consultant'.",
        )

    price_id = _get_price_id(tier, body.annual)
    meta = TIER_METADATA[tier]

    uid = current_user["uid"]
    email = current_user.get("email", "")
    customer_id = _get_or_create_stripe_customer(uid, email)

    session = stripe.checkout.Session.create(
        customer=customer_id,
        mode="subscription",
        line_items=[{"price": price_id, "quantity": 1}],
        subscription_data={"trial_period_days": 7},
        success_url=body.success_url,
        cancel_url=body.cancel_url,
        metadata={
            "firebase_uid": uid,
            "tier": tier,
            "asin_limit": str(meta["asin_limit"]),
            "analysis_limit": str(meta["analysis_limit"]),
        },
    )

    return {"checkout_url": session.url, "session_id": session.id}


@router.post("/api/checkout/create-portal-session")
async def create_portal_session(
    body: CreatePortalRequest,
    current_user: dict = Depends(get_current_user),
):
    """Create a Stripe Customer Portal session for managing subscription."""
    _require_stripe()
    _require_db()

    uid = current_user["uid"]
    snap = db.collection("users").document(uid).get()
    if not snap.exists:
        raise HTTPException(status_code=404, detail="User not found")

    customer_id = snap.to_dict().get("stripe_customer_id")
    if not customer_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No billing account found. Subscribe to Pro first.",
        )

    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=body.return_url,
    )

    return {"portal_url": session.url}


@router.get("/api/user/subscription")
async def get_subscription(current_user: dict = Depends(get_current_user)):
    """Return the user's current tier, subscription status, limits, and usage from Firestore."""
    _require_db()

    uid = current_user["uid"]

    # Get user tier
    user_snap = db.collection("users").document(uid).get()
    tier = "free"
    if user_snap.exists:
        tier = user_snap.to_dict().get("tier", "free")

    # Normalise legacy "pro" tier
    if tier == "pro":
        tier = "owner"

    limits = TIER_LIMITS.get(tier, TIER_LIMITS["free"])

    # Get subscription details
    sub_snap = db.collection("subscriptions").document(uid).get()
    sub_status = "none"
    plan = None
    current_period_end = None
    if sub_snap.exists:
        raw = sub_snap.to_dict()
        sub_status = raw.get("status", "none")
        plan = raw.get("plan")
        current_period_end = raw.get("current_period_end")
        if hasattr(current_period_end, "isoformat"):
            current_period_end = current_period_end.isoformat()

    # Get usage for current month
    month = datetime.utcnow().strftime("%Y-%m")
    usage_snap = db.collection("usage").document(f"{uid}_{month}").get()
    analyses_used = 0
    asins_used = 0
    if usage_snap.exists:
        usage_data = usage_snap.to_dict()
        analyses_used = usage_data.get("analysesUsed", usage_data.get("analysis_count", 0))
        asins_used = len(usage_data.get("uniqueAsins", []))

    return {
        # ── Flat fields the frontend SubscriptionContext reads ──────────────
        # plan is sent as tier so parseTier() resolves correctly for free users
        # (subscription doc may have null plan before first purchase)
        "plan": plan or tier,
        "is_pro": tier not in ("free",),
        "status": sub_status,
        "usage_count": analyses_used,       # gauge reads this directly
        "usage_limit": limits["analyses"],
        "current_period_end": current_period_end,  # snake_case matches SubscriptionApiResponse
        "billing_cycle": None,              # TODO: pull from Stripe subscription doc
        # ── Nested format kept for future use ──────────────────────────────
        "tier": tier,
        "limits": {
            "asins": limits["asins"],
            "analyses": limits["analyses"],
        },
        "usage": {
            "asinsUsed": asins_used,
            "analysesUsed": analyses_used,
        },
    }
