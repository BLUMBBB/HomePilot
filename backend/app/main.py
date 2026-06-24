"""FastAPI application — точка входа."""
import logging
import logging.config
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.config import get_settings


def _configure_logging() -> None:
    """JSON logs in production, plain text in development."""
    log_level = os.environ.get("LOG_LEVEL", "INFO").upper()
    is_prod = os.environ.get("APP_ENV", "development") == "production"
    if is_prod:
        try:
            from pythonjsonlogger import jsonlogger  # type: ignore

            handler = logging.StreamHandler()
            handler.setFormatter(
                jsonlogger.JsonFormatter(
                    fmt="%(asctime)s %(levelname)s %(name)s %(message)s",
                    datefmt="%Y-%m-%dT%H:%M:%SZ",
                )
            )
            logging.basicConfig(level=log_level, handlers=[handler], force=True)
            return
        except ImportError:
            pass
    logging.basicConfig(
        level=log_level,
        format="%(asctime)s %(levelname)s %(name)s — %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )


_configure_logging()
from app.api.v1.router import api_v1_router
from app.core.exceptions import AppException, app_exception_handler
from app.core.rate_limit import InMemoryRateLimiter
from app.openapi_config import (
    API_DESCRIPTION,
    CONTACT,
    LICENSE_INFO,
    OPENAPI_TAGS,
    attach_custom_openapi,
    swagger_ui_parameters,
)


# Rate limiters: window 60 s, разные лимиты по эндпоинтам
_rate_limiter = InMemoryRateLimiter(window_seconds=60)
_RATE_LIMIT_RULES: dict[str, int] = {
    "/api/v1/auth/login":           10,
    "/api/v1/auth/register":         5,
    "/api/v1/auth/register-executor": 5,
    "/api/v1/auth/forgot-password":  5,
    "/api/v1/auth/reset-password":   5,
    "/api/v1/auth/confirm-email":    10,
    "/api/v1/auth/google":           10,
}


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup/shutdown: при необходимости инициализация БД, Redis."""
    yield
    # shutdown: close pools if needed


_DEFAULT_SECRET = "change-me-in-production-secret-key-min-32-chars"


def create_app() -> FastAPI:
    settings = get_settings()

    is_production = settings.APP_ENV == "production"
    if is_production and settings.SECRET_KEY == _DEFAULT_SECRET:
        raise RuntimeError("SECRET_KEY не изменён — запуск в production с дефолтным ключом запрещён")

    app = FastAPI(
        title="HomePilot API",
        description=API_DESCRIPTION,
        version="1.0.0",
        openapi_tags=OPENAPI_TAGS,
        contact=CONTACT,
        license_info=LICENSE_INFO,
        lifespan=lifespan,
        docs_url="/docs" if not is_production else None,
        redoc_url="/redoc" if not is_production else None,
        swagger_ui_parameters=swagger_ui_parameters(),
    )
    attach_custom_openapi(app)

    openapi_dir = Path(__file__).resolve().parent.parent / "static" / "openapi"
    if openapi_dir.is_dir():
        app.mount(
            "/openapi-assets",
            StaticFiles(directory=str(openapi_dir)),
            name="openapi_assets",
        )

    origins = settings.CORS_ORIGINS
    if isinstance(origins, str):
        origins = [o.strip() for o in origins.split(",")]
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.middleware("http")
    async def rate_limit_middleware(request: Request, call_next):
        limit = _RATE_LIMIT_RULES.get(request.url.path)
        if limit is not None:
            ip = request.headers.get("X-Forwarded-For", request.client.host if request.client else "unknown").split(",")[0].strip()
            if not _rate_limiter.is_allowed((ip, request.url.path), limit):
                return JSONResponse(
                    status_code=429,
                    content={"detail": "Слишком много запросов. Попробуйте позже."},
                )
        return await call_next(request)

    @app.middleware("http")
    async def security_headers_middleware(request: Request, call_next):
        response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "SAMEORIGIN"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        return response

    app.include_router(api_v1_router, prefix="/api/v1")
    app.add_exception_handler(AppException, app_exception_handler)

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

    @app.get("/health")
    async def health() -> dict:
        """Health check для деплоя — проверяет DB connectivity."""
        from sqlalchemy import text
        from app.db.session import async_session_maker
        db_ok = False
        try:
            async with async_session_maker() as session:
                await session.execute(text("SELECT 1"))
            db_ok = True
        except Exception:
            pass
        status = "ok" if db_ok else "degraded"
        return {"status": status, "version": "1.0.0", "db": db_ok}

    return app


app = create_app()
