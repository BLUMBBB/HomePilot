"""Profile /me: текущий пользователь, обновление, смена пароля."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, DbSession, require_role
from app.core.security import get_password_hash
from app.schemas.user import UserResponse, UserUpdate
from app.schemas.auth import ChangePasswordRequest

router = APIRouter(prefix="/me", tags=["me"])


@router.get("", response_model=UserResponse)
async def get_me(current_user: CurrentUser):
    return UserResponse.model_validate(current_user)


@router.patch("", response_model=UserResponse)
async def update_me(
    payload: UserUpdate,
    current_user: CurrentUser,
    db: DbSession,
):
    if payload.name is not None:
        current_user.name = payload.name
    if payload.phone is not None:
        current_user.phone = payload.phone
    if payload.locale is not None:
        current_user.locale = payload.locale
    await db.flush()
    await db.refresh(current_user)
    return UserResponse.model_validate(current_user)


@router.post("/change-password")
async def change_password(
    payload: ChangePasswordRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    from app.core.security import verify_password
    if not current_user.password_hash or not verify_password(payload.current_password, current_user.password_hash):
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="Неверный текущий пароль")
    current_user.password_hash = get_password_hash(payload.new_password)
    await db.flush()
    return {"message": "Пароль изменён"}
