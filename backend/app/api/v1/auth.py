"""Auth endpoints: register, login, refresh, forgot/reset password."""
from fastapi import APIRouter, Depends

from app.core.dependencies import DbSession
from app.core.security import create_access_token, create_refresh_token
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    RegisterExecutorRequest,
    RefreshRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    ConfirmEmailRequest,
    GoogleSignInRequest,
)
from app.schemas.user import UserResponse
from app.services import auth as auth_service

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=dict)
async def register(
    payload: RegisterRequest,
    db: DbSession,
):
    print(">>> REGISTER: запрос получен, email:", payload.email, "<<<", flush=True)
    user = await auth_service.register_client(db, payload)
    return {
        "user": UserResponse.model_validate(user),
        "message": "Зарегистрированы. Подтвердите email (или войдите).",
    }


@router.post("/register-executor", response_model=dict)
async def register_executor(
    payload: RegisterExecutorRequest,
    db: DbSession,
):
    user = await auth_service.register_executor(db, payload)
    access, expires_sec = create_access_token(user.id, user.role.value)[0], 30 * 60
    refresh = create_refresh_token(user.id)
    return {
        "user": UserResponse.model_validate(user),
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "expires_in": expires_sec,
    }


@router.post("/google", response_model=dict)
async def login_google(
    payload: GoogleSignInRequest,
    db: DbSession,
):
    user = await auth_service.login_with_google(db, payload.id_token)
    access, refresh, expires_sec = auth_service.tokens_for_user(user)
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "expires_in": expires_sec,
        "user": UserResponse.model_validate(user),
    }


@router.post("/login", response_model=dict)
async def login(
    payload: LoginRequest,
    db: DbSession,
):
    user = await auth_service.authenticate_user(db, payload.email, payload.password)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    access, refresh, expires_sec = auth_service.tokens_for_user(user)
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "expires_in": expires_sec,
        "user": UserResponse.model_validate(user),
    }


@router.post("/refresh", response_model=dict)
async def refresh(
    payload: RefreshRequest,
    db: DbSession,
):
    user = await auth_service.get_user_by_refresh_token(db, payload.refresh_token)
    if not user:
        from fastapi import HTTPException
        raise HTTPException(status_code=401, detail="Недействительный refresh token")
    access, refresh, expires_sec = auth_service.tokens_for_user(user)
    return {
        "access_token": access,
        "refresh_token": refresh,
        "token_type": "bearer",
        "expires_in": expires_sec,
    }


@router.post("/forgot-password")
async def forgot_password(
    payload: ForgotPasswordRequest,
    db: DbSession,
):
    await auth_service.request_password_reset(db, str(payload.email))
    return {"message": "Если email зарегистрирован, на почту отправлен код для сброса пароля."}


@router.post("/reset-password")
async def reset_password(
    payload: ResetPasswordRequest,
    db: DbSession,
):
    await auth_service.reset_password_with_code(db, payload.token, payload.new_password)
    return {"message": "Пароль успешно изменён."}


@router.post("/confirm-email", response_model=dict)
async def confirm_email(
    payload: ConfirmEmailRequest,
    db: DbSession,
):
    """Подтверждение email по 6-значному коду из письма."""
    user = await auth_service.confirm_email(db, payload.code)
    return {
        "user": UserResponse.model_validate(user),
        "message": "Email успешно подтверждён. Теперь вы можете войти.",
    }
