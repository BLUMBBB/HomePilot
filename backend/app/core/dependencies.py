"""Зависимости: get_current_user, get_db, проверка ролей."""
from typing import Annotated

from fastapi import Depends, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.exceptions import ForbiddenError
from app.core.security import decode_token
from app.db.session import async_session_maker, get_db
from app.models.user import User
from app.db.session import get_db as _get_db

security = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    db: Annotated[AsyncSession, Depends(_get_db)],
) -> User:
    if not credentials:
        raise ForbiddenError("Требуется авторизация", detail="Missing or invalid token")
    payload = decode_token(credentials.credentials)
    if not payload or payload.get("type") != "access":
        raise ForbiddenError("Недействительный токен", detail="Invalid or expired token")
    user_id = payload.get("sub")
    if not user_id:
        raise ForbiddenError("Недействительный токен")
    from uuid import UUID
    from sqlalchemy import select
    from app.models import User as UserModel
    try:
        uid = UUID(user_id)
    except ValueError:
        raise ForbiddenError("Недействительный токен")
    result = await db.execute(select(UserModel).where(UserModel.id == uid))
    user = result.scalar_one_or_none()
    if not user:
        raise ForbiddenError("Пользователь не найден")
    if not user.is_active:
        raise ForbiddenError("Аккаунт деактивирован")
    return user


def require_role(*allowed_roles: str):
    """Зависимость: текущий пользователь должен иметь одну из ролей."""
    async def _check(current_user: Annotated[User, Depends(get_current_user)]) -> User:
        if current_user.role not in allowed_roles:
            raise ForbiddenError("Недостаточно прав", detail="Insufficient permissions")
        return current_user
    return Depends(_check)


# Типы для аннотаций в роутерах
CurrentUser = Annotated[User, Depends(get_current_user)]
DbSession = Annotated[AsyncSession, Depends(_get_db)]
