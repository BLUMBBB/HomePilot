"""Кастомные исключения и обработчик для единообразного JSON."""
from typing import Any

from fastapi import Request, status
from fastapi.responses import JSONResponse


class AppException(Exception):
    """Базовое прикладное исключение."""
    def __init__(self, message: str, status_code: int = 400, detail: Any = None):
        self.message = message
        self.status_code = status_code
        self.detail = detail or message


class NotFoundError(AppException):
    def __init__(self, message: str = "Not found", detail: Any = None):
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND, detail=detail)


class ForbiddenError(AppException):
    def __init__(self, message: str = "Forbidden", detail: Any = None):
        super().__init__(message, status_code=status.HTTP_403_FORBIDDEN, detail=detail)


class ConflictError(AppException):
    def __init__(self, message: str = "Conflict", detail: Any = None):
        super().__init__(message, status_code=status.HTTP_409_CONFLICT, detail=detail)


class SubscriptionNotFoundError(NotFoundError):
    def __init__(self):
        super().__init__(message="Подписка не найдена")


class VisitNotFoundError(NotFoundError):
    def __init__(self):
        super().__init__(message="Визит не найден")


class VisitNotReschedulableError(ConflictError):
    def __init__(self, message: str = "Визит нельзя перенести"):
        super().__init__(message=message)


class InvalidInviteCodeError(ConflictError):
    def __init__(self):
        super().__init__(message="Код приглашения недействителен или уже использован")


async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail if isinstance(exc.detail, (str, type(None))) else exc.detail},
    )
