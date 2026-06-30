"""FastAPI application — точка входа."""
from contextlib import asynccontextmanager
from pathlib import Path
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.api.v1.router import api_v1_router
from app.core.exceptions import AppException, app_exception_handler
from app.openapi_config import (
    API_DESCRIPTION,
    CONTACT,
    LICENSE_INFO,
    OPENAPI_TAGS,
    attach_custom_openapi,
    swagger_ui_parameters,
)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Startup/shutdown: при необходимости инициализация БД, Redis."""
    yield
    # shutdown: close pools if needed


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="HomePilot API",
        description=API_DESCRIPTION,
        version="1.0.0",
        openapi_tags=OPENAPI_TAGS,
        contact=CONTACT,
        license_info=LICENSE_INFO,
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
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

    app.include_router(api_v1_router, prefix="/api/v1")
    app.add_exception_handler(AppException, app_exception_handler)

    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    app.mount("/uploads", StaticFiles(directory=str(upload_dir)), name="uploads")

    @app.get("/health")
    async def health() -> dict:
        """Health check для деплоя."""
        return {"status": "ok", "version": "1.0.0"}

    return app


app = create_app()
