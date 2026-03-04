"""
Global error handling and optional Sentry integration.

Usage:
    from app.middleware.error_handler import configure_error_handlers, init_sentry
    init_sentry()
    configure_error_handlers(app)
"""
import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.config import get_settings

logger = logging.getLogger(__name__)


def init_sentry() -> None:
    """Initialize Sentry SDK if SENTRY_DSN is configured."""
    settings = get_settings()
    if not settings.SENTRY_DSN:
        return

    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        from sentry_sdk.integrations.starlette import StarletteIntegration

        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            environment=settings.ENVIRONMENT,
            traces_sample_rate=0.1 if settings.is_production else 1.0,
            integrations=[
                StarletteIntegration(),
                FastApiIntegration(),
            ],
        )
        logger.info(f"Sentry initialized (env={settings.ENVIRONMENT})")
    except ImportError:
        logger.warning("sentry-sdk not installed — skipping Sentry init")
    except Exception as e:
        logger.error(f"Sentry init failed: {e}")


def configure_error_handlers(app: FastAPI) -> None:
    """Register global exception handlers on the FastAPI app."""
    settings = get_settings()

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(request: Request, exc: StarletteHTTPException):
        return JSONResponse(
            status_code=exc.status_code,
            content={"error": exc.detail, "code": exc.status_code},
        )

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "error": "Validation error",
                "detail": exc.errors(),
                "code": 422,
            },
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)

        # Let Sentry capture it if available
        try:
            import sentry_sdk
            sentry_sdk.capture_exception(exc)
        except ImportError:
            pass

        detail = str(exc) if settings.DEBUG else "An unexpected error occurred"
        return JSONResponse(
            status_code=500,
            content={"error": "Internal server error", "detail": detail, "code": 500},
        )
