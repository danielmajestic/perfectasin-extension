"""
TitlePerfect FastAPI Backend
Main application entry point
"""
import logging
import sys
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import get_settings
from app.middleware.cors import configure_cors
from app.middleware.error_handler import configure_error_handlers, init_sentry
from app.routers import analyze, asin, user
from app.routers import checkout, webhooks, history, admin
from app.routers import analyze_bullets
from app.routers import analyze_description
from app.routers import analyze_hero_image
from app.routers import analyze_price

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)

logger = logging.getLogger(__name__)

# Initialize Sentry before app creation
init_sentry()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan events for startup and shutdown"""
    logger.info("Starting TitlePerfect API server...")
    settings = get_settings()
    try:
        settings.validate()
        logger.info(f"Environment: {settings.ENVIRONMENT}")
        logger.info(f"Claude basic model: {settings.CLAUDE_MODEL_BASIC}")
        logger.info(f"Claude full model:  {settings.CLAUDE_MODEL_FULL}")
        logger.info("Configuration validated successfully")
    except ValueError as e:
        logger.error(f"Configuration error: {e}")
        sys.exit(1)

    yield

    logger.info("Shutting down TitlePerfect API server...")


# Initialize FastAPI app
settings = get_settings()

app = FastAPI(
    title="TitlePerfect API",
    description="AI-powered Amazon title optimization API",
    version=settings.APP_VERSION,
    docs_url="/docs" if not settings.is_production else None,
    redoc_url="/redoc" if not settings.is_production else None,
    lifespan=lifespan,
)

# Middleware & error handlers
configure_cors(app)
configure_error_handlers(app)

# Routers
app.include_router(analyze.router)
app.include_router(asin.router)
app.include_router(user.router)
app.include_router(checkout.router)
app.include_router(webhooks.router)
app.include_router(history.router)
app.include_router(admin.router)
app.include_router(analyze_bullets.router)
app.include_router(analyze_description.router)
app.include_router(analyze_hero_image.router)
app.include_router(analyze_price.router)


# -- Health checks -----------------------------------------------------------

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "name": "TitlePerfect API",
        "version": settings.APP_VERSION,
        "status": "healthy",
    }


@app.get("/health")
async def health_check():
    """Lightweight health check for load balancers."""
    return {"status": "healthy"}


@app.get("/api/health")
async def api_health():
    """
    Detailed health check — reports service readiness
    and integration status.
    """
    from app.firebase import db
    from app.stripe_config import stripe as stripe_mod

    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "environment": settings.ENVIRONMENT,
        "integrations": {
            "anthropic": bool(settings.ANTHROPIC_API_KEY),
            "firebase": db is not None,
            "stripe": stripe_mod is not None,
            "sentry": bool(settings.SENTRY_DSN),
        },
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
