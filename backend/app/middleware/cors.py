"""
CORS configuration for TitlePerfect.

Uses CHROME_EXTENSION_ID and ENVIRONMENT env vars via Settings
to build an explicit allow-list of origins.

Usage:
    from app.middleware.cors import configure_cors
    configure_cors(app)
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings


def configure_cors(app: FastAPI) -> None:
    """Add CORS middleware with environment-appropriate origins."""
    settings = get_settings()

    if settings.is_production:
        # Hardcoded baseline — always allowed in production.
        # These must never be missing even if env vars are unset.
        origins = [
            "chrome-extension://kmdfaflcppcmddkoiapokpcmaglbkkii",
            "https://titleperfect.app",
            "https://www.titleperfect.app",
        ]

        # CHROME_EXTENSION_ID env var — supports additional/override IDs.
        # Guard against double-prefix (e.g. if someone stored the full URL).
        if settings.CHROME_EXTENSION_ID:
            ext_id = settings.CHROME_EXTENSION_ID.strip()
            ext_origin = (
                ext_id
                if ext_id.startswith("chrome-extension://")
                else f"chrome-extension://{ext_id}"
            )
            if ext_origin not in origins:
                origins.append(ext_origin)

        # Explicit frontend URL if set
        if settings.FRONTEND_URL:
            url = settings.FRONTEND_URL.strip().rstrip("/")
            if url not in origins:
                origins.append(url)

        app.add_middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_credentials=True,
            allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["Authorization", "Content-Type", "authorization", "content-type"],
            max_age=3600,
        )
    else:
        # Development — permissive for local testing
        app.add_middleware(
            CORSMiddleware,
            allow_origins=[
                "*",
                "http://localhost:3000",
                "http://localhost:5173",
                "http://localhost:8080",
            ],
            allow_credentials=False,
            allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["*"],
            expose_headers=["*"],
            max_age=3600,
        )
