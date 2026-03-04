"""
Stripe webhook handler.

POST /api/webhooks/stripe — receives Stripe events, verifies signature,
syncs subscription state to Firestore.
"""
import logging
import os
from datetime import datetime

from fastapi import APIRouter, Request, HTTPException

from app.firebase import db
from app.stripe_config import stripe, STRIPE_WEBHOOK_SECRET

logger = logging.getLogger(__name__)
router = APIRouter(tags=["webhooks"])

# Tier metadata: limits written to Firestore subscription doc
_TIER_LIMITS = {
    "owner":      {"asinLimit": 50,     "analysisLimit": 200},
    "consultant": {"asinLimit": 150,    "analysisLimit": 600},
    "agency":     {"asinLimit": 999999, "analysisLimit": 999999},
    "free":       {"asinLimit": 3,      "analysisLimit": 5},
}

# Built lazily so env vars are available at webhook call time
def _build_price_to_tier() -> dict[str, dict]:
    """Map Stripe price IDs → {"tier": ..., "plan": ...}."""
    mapping: dict[str, dict] = {}

    # Legacy Pro price IDs — map to "owner" for backward compat
    for price_id in [
        "price_1T0u3hD0k6gutq2QupISMqWG",  # old pro monthly
        "price_1T0u5JD0k6gutq2QhMWNZpRu",  # old pro annual
    ]:
        if price_id:
            mapping[price_id] = {"tier": "owner", "plan": "monthly" if "3h" in price_id else "annual"}
    # Also pick up from env vars if operator overrode them
    for env_var, tier, plan in [
        ("STRIPE_PRO_MONTHLY_PRICE_ID", "owner",      "monthly"),
        ("STRIPE_PRO_ANNUAL_PRICE_ID",  "owner",      "annual"),
        ("STRIPE_OWNER_MONTHLY_PRICE_ID",      "owner",      "monthly"),
        ("STRIPE_OWNER_ANNUAL_PRICE_ID",        "owner",      "annual"),
        ("STRIPE_CONSULTANT_MONTHLY_PRICE_ID",  "consultant", "monthly"),
        ("STRIPE_CONSULTANT_ANNUAL_PRICE_ID",   "consultant", "annual"),
    ]:
        pid = os.getenv(env_var)
        if pid:
            mapping[pid] = {"tier": tier, "plan": plan}
    return mapping


def _tier_from_status(sub_status: str, tier: str) -> str:
    """Derive user tier from Stripe subscription status."""
    if sub_status in ("active", "trialing"):
        return tier
    return "free"


def _parse_item_tier_plan(items_data: dict) -> tuple[str, str]:
    """Extract tier and plan from subscription items via price ID lookup."""
    price_map = _build_price_to_tier()
    for item in items_data.get("data", []):
        price_id = item.get("price", {}).get("id")
        if price_id and price_id in price_map:
            info = price_map[price_id]
            return info["tier"], info["plan"]
    return "owner", "monthly"  # safe default


def _sync_subscription(subscription: dict):
    """
    Write subscription data to Firestore and update user tier.
    Looks up firebase_uid from Customer metadata.
    """
    if db is None:
        logger.warning("Firestore not configured — skipping subscription sync")
        return

    customer_id = subscription.get("customer")
    sub_id = subscription.get("id")
    sub_status = subscription.get("status", "")

    # Look up firebase_uid from Stripe Customer metadata
    uid = None
    if stripe and customer_id:
        try:
            customer = stripe.Customer.retrieve(customer_id)
            uid = customer.get("metadata", {}).get("firebase_uid")
        except Exception as e:
            logger.error(f"Failed to retrieve Stripe customer {customer_id}: {e}")

    if not uid:
        logger.error(
            f"Cannot sync subscription {sub_id} — "
            f"no firebase_uid on customer {customer_id}"
        )
        return

    # Determine tier and plan from line items
    tier, plan = _parse_item_tier_plan(subscription.get("items", {}))
    new_tier = _tier_from_status(sub_status, tier)
    limits = _TIER_LIMITS.get(new_tier, _TIER_LIMITS["free"])

    # Parse current_period_end
    period_end_ts = subscription.get("current_period_end")
    period_end = (
        datetime.utcfromtimestamp(period_end_ts) if period_end_ts else None
    )

    # Write subscription doc
    db.collection("subscriptions").document(uid).set({
        "uid": uid,
        "stripe_subscription_id": sub_id,
        "status": sub_status,
        "current_period_end": period_end,
        "plan": plan,
        "tier": new_tier,
        "asinLimit": limits["asinLimit"],
        "analysisLimit": limits["analysisLimit"],
    })

    # Update user tier
    db.collection("users").document(uid).set(
        {"tier": new_tier}, merge=True
    )

    logger.info(
        f"Synced subscription {sub_id} for user {uid}: "
        f"status={sub_status}, tier={new_tier}, plan={plan}"
    )


def _handle_subscription_deleted(subscription: dict):
    """Handle subscription cancellation — set tier back to free."""
    if db is None:
        return

    customer_id = subscription.get("customer")
    sub_id = subscription.get("id")

    uid = None
    if stripe and customer_id:
        try:
            customer = stripe.Customer.retrieve(customer_id)
            uid = customer.get("metadata", {}).get("firebase_uid")
        except Exception as e:
            logger.error(f"Failed to retrieve customer {customer_id}: {e}")

    if not uid:
        logger.error(f"Cannot process deletion for subscription {sub_id}")
        return

    # Update subscription doc status
    db.collection("subscriptions").document(uid).set({
        "uid": uid,
        "stripe_subscription_id": sub_id,
        "status": "canceled",
        "current_period_end": None,
        "plan": "",
    })

    # Downgrade user tier
    db.collection("users").document(uid).set(
        {"tier": "free"}, merge=True
    )

    logger.info(f"Subscription {sub_id} deleted for user {uid} — tier set to free")


# -- Endpoint ----------------------------------------------------------------

@router.post("/api/webhooks/stripe")
async def stripe_webhook(request: Request):
    """
    Receive Stripe webhook events.
    Verifies signature if STRIPE_WEBHOOK_SECRET is configured.
    """
    if stripe is None:
        raise HTTPException(status_code=503, detail="Stripe not configured")

    payload = await request.body()

    # Verify webhook signature
    if STRIPE_WEBHOOK_SECRET:
        sig_header = request.headers.get("stripe-signature")
        if not sig_header:
            raise HTTPException(status_code=400, detail="Missing stripe-signature header")
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except stripe.error.SignatureVerificationError:
            logger.warning("Stripe webhook signature verification failed")
            raise HTTPException(status_code=400, detail="Invalid signature")
    else:
        # Dev mode — parse without verification
        import json
        event = json.loads(payload)

    event_type = event.get("type", "") if isinstance(event, dict) else event["type"]
    logger.info(f"Stripe webhook received: {event_type}")

    # Extract event data
    data_object = (
        event.get("data", {}).get("object", {})
        if isinstance(event, dict)
        else event["data"]["object"]
    )

    if event_type in ("customer.subscription.created", "customer.subscription.updated"):
        _sync_subscription(data_object)
    elif event_type == "customer.subscription.deleted":
        _handle_subscription_deleted(data_object)
    else:
        logger.debug(f"Unhandled Stripe event type: {event_type}")

    return {"received": True}
