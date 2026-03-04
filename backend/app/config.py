"""
Centralized configuration for TitlePerfect backend.

All env vars are loaded via pydantic BaseSettings.
Use get_settings() to access the cached singleton.
"""
from functools import lru_cache
from typing import Optional

from pydantic import field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # -- Environment ----------------------------------------------------------
    ENVIRONMENT: str = "development"  # "development" | "staging" | "production"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # -- Anthropic / Claude ---------------------------------------------------
    ANTHROPIC_API_KEY: str = ""
    CLAUDE_MODEL: str = "claude-sonnet-4-6"          # deprecated — use BASIC/FULL below
    CLAUDE_MODEL_BASIC: str = "claude-sonnet-4-6"    # scores-only / free tier
    CLAUDE_MODEL_FULL: str = "claude-sonnet-4-6"     # full analysis + variations / pro tier
    CLAUDE_MAX_TOKENS: int = 4096
    CLAUDE_TEMPERATURE: float = 0.7

    # -- Firebase -------------------------------------------------------------
    GOOGLE_APPLICATION_CREDENTIALS: Optional[str] = None

    # -- Stripe ---------------------------------------------------------------
    STRIPE_SECRET_KEY: Optional[str] = None
    STRIPE_WEBHOOK_SECRET: Optional[str] = None
    # Legacy price IDs — kept for backward compatibility with existing test subscriptions
    STRIPE_PRO_MONTHLY_PRICE_ID: Optional[str] = None
    STRIPE_PRO_ANNUAL_PRICE_ID: Optional[str] = None
    # New 4-tier price IDs
    STRIPE_OWNER_MONTHLY_PRICE_ID: Optional[str] = None
    STRIPE_OWNER_ANNUAL_PRICE_ID: Optional[str] = None
    STRIPE_CONSULTANT_MONTHLY_PRICE_ID: Optional[str] = None
    STRIPE_CONSULTANT_ANNUAL_PRICE_ID: Optional[str] = None

    # -- CORS -----------------------------------------------------------------
    CHROME_EXTENSION_ID: Optional[str] = None
    FRONTEND_URL: Optional[str] = None

    # -- Sentry ---------------------------------------------------------------
    SENTRY_DSN: Optional[str] = None

    # -- GCP / Cloud Run ------------------------------------------------------
    GCP_PROJECT_ID: Optional[str] = None
    GCP_REGION: str = "us-central1"
    PORT: int = 8080

    # -- Rate Limiting --------------------------------------------------------
    FREE_TIER_MONTHLY_LIMIT: int = 5   # matches TIER_LIMITS["free"]["analyses"]
    PRO_TIER_MONTHLY_LIMIT: int = 200  # legacy — kept for backward compat

    # -- Admin ----------------------------------------------------------------
    ADMIN_UIDS: str = ""  # comma-separated Firebase UIDs with admin access

    # -- App metadata ---------------------------------------------------------
    APP_NAME: str = "TitlePerfect"
    APP_VERSION: str = "1.0.0"

    @field_validator("ANTHROPIC_API_KEY", mode="before")
    @classmethod
    def clean_api_key(cls, v: str) -> str:
        """Strip multi-line preamble from ANTHROPIC_API_KEY.

        The system env var may contain a human-readable label on the first
        line followed by the real key on a second line, e.g.:
            'Claude Code Team Fallback Anthropic Key\\nsk-ant-api03-...'
        Find and return only the sk-ant- portion.
        """
        if not v:
            return v
        # Fast path: already a clean key
        if v.startswith("sk-ant-"):
            return v.strip()
        # Look for sk-ant- substring (handles newline-prefixed values)
        idx = v.find("sk-ant-")
        if idx >= 0:
            # Take from sk-ant- up to the first whitespace or end of string
            tail = v[idx:]
            return tail.split()[0]
        # Last resort: strip whitespace and return whatever we have
        return v.strip()

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }

    @property
    def is_production(self) -> bool:
        return self.ENVIRONMENT == "production"

    def validate(self) -> None:
        """Validate required settings. Called at startup."""
        if not self.ANTHROPIC_API_KEY:
            raise ValueError(
                "ANTHROPIC_API_KEY environment variable is required. "
                "Please set it in your .env file or environment."
            )


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Uses lru_cache to create a singleton.
    """
    return Settings()
