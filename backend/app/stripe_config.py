"""
Stripe SDK initialization for TitlePerfect.

Exports:
    stripe: configured stripe module (or None in dev mode)
    STRIPE_WEBHOOK_SECRET: webhook signing secret (or None)

Set STRIPE_SECRET_KEY and STRIPE_WEBHOOK_SECRET env vars.
If missing, runs in dev mode with Stripe features disabled.
"""
import logging
import os

logger = logging.getLogger(__name__)

stripe = None
STRIPE_WEBHOOK_SECRET = None

_secret_key = os.getenv("STRIPE_SECRET_KEY")
_webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

if _secret_key:
    try:
        import stripe as _stripe
        _stripe.api_key = _secret_key
        stripe = _stripe
        STRIPE_WEBHOOK_SECRET = _webhook_secret
        logger.info("Stripe SDK initialized successfully")
        if not _webhook_secret:
            logger.warning(
                "STRIPE_WEBHOOK_SECRET not set — webhook signature "
                "verification will be disabled."
            )
    except Exception as e:
        logger.error(f"Stripe init failed: {e}")
else:
    logger.warning(
        "STRIPE_SECRET_KEY not set. "
        "Running in dev mode — Stripe features disabled."
    )
