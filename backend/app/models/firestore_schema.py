"""
Pydantic models for Firestore collections.

Collections:
    users          — user profile and tier info
    subscriptions  — Stripe subscription state
    usage          — monthly analysis counters
    analyses       — saved analysis results
    waitlist       — pre-launch signups
"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class UserDoc(BaseModel):
    """users/{uid}"""
    uid: str
    email: str
    display_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: datetime = Field(default_factory=datetime.utcnow)
    tier: str = "free"  # "free" | "pro" | "enterprise"
    stripe_customer_id: Optional[str] = None


class SubscriptionDoc(BaseModel):
    """subscriptions/{uid}"""
    uid: str
    stripe_subscription_id: str
    status: str  # "active" | "canceled" | "past_due" | "trialing"
    current_period_end: datetime
    plan: str  # "pro_monthly" | "pro_annual"


class UsageDoc(BaseModel):
    """usage/{uid}_{month}  — month format: YYYY-MM"""
    uid: str
    month: str  # "2026-02"
    analysis_count: int = 0
    last_analysis_at: Optional[datetime] = None


class AnalysisDoc(BaseModel):
    """analyses/{auto-id}"""
    uid: str
    asin: str
    title: str
    scores: dict  # {seo, rufus, conversion, overall}
    variations: list[dict] = Field(default_factory=list)
    icp: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)


class WaitlistDoc(BaseModel):
    """waitlist/{auto-id}"""
    email: str
    name: Optional[str] = None
    amazon_store_url: Optional[str] = None
    asin_count: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
