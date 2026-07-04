"""Structured JSON logging for production (stdout — collected by `docker logs`)."""
import logging
import logging.config

from app.config import get_settings


def configure_logging() -> None:
    settings = get_settings()
    level = "DEBUG" if settings.DEBUG else "INFO"

    logging.config.dictConfig(
        {
            "version": 1,
            "disable_existing_loggers": False,
            "formatters": {
                "json": {
                    "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
                    "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
                },
            },
            "handlers": {
                "default": {
                    "class": "logging.StreamHandler",
                    "formatter": "json",
                },
            },
            "root": {
                "handlers": ["default"],
                "level": level,
            },
            "loggers": {
                "uvicorn": {"handlers": ["default"], "level": level, "propagate": False},
                "uvicorn.access": {"handlers": ["default"], "level": level, "propagate": False},
                "uvicorn.error": {"handlers": ["default"], "level": level, "propagate": False},
            },
        }
    )
