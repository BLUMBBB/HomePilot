"""Payments: список, создание intent, подтверждение по коду (тестовый платёж)."""
import logging
from uuid import UUID

from fastapi import APIRouter, Depends

logger = logging.getLogger(__name__)
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import CurrentUser, DbSession
from app.models import Payment
from app.schemas.payment import (
    ConfirmPaymentRequest,
    CreatePaymentIntentRequest,
    PaymentResponse,
    StripeCheckoutCompleteRequest,
    SubmitCardRequest,
)
from app.services import payment as payment_service

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("", response_model=list[PaymentResponse])
async def list_payments(
    current_user: CurrentUser,
    db: DbSession,
):
    result = await db.execute(
        select(Payment).where(Payment.user_id == current_user.id).order_by(Payment.created_at.desc())
    )
    payments = result.scalars().all()
    return [PaymentResponse.model_validate(p) for p in payments]


@router.post("/create-intent", response_model=dict)
async def create_payment_intent(
    payload: CreatePaymentIntentRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    payment, redirect_url, _, provider = await payment_service.create_payment_intent(
        db,
        payload.subscription_id,
        current_user.id,
        payload.return_url,
        payload.cancel_url,
    )
    return {
        "payment_id": payment.id,
        "redirect_url": redirect_url,
        "provider": provider,
    }


@router.post("/stripe/complete", response_model=dict)
async def stripe_checkout_complete(
    payload: StripeCheckoutCompleteRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """Если webhook Stripe не дошёл, после return с session_id активируем платёж так же, как по webhook."""
    payment = await payment_service.complete_stripe_checkout_session(
        db, current_user.id, payload.session_id.strip()
    )
    return {
        "payment_id": str(payment.id),
        "status": str(payment.status),
        "message": "Оплата подтверждена, подписка активирована.",
    }


@router.post("/simulate-card", response_model=dict)
@router.post("/submit-card", response_model=dict)
async def submit_card(
    payload: SubmitCardRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """Имитация оплаты картой: проверка формата, возврат кода подтверждения (тест). Данные карты не сохраняются."""
    from app.models import Payment
    from app.models.payment import PaymentStatus
    from app.models.payment_confirm_code import PaymentConfirmCode
    from app.core.exceptions import ForbiddenError, NotFoundError
    from datetime import datetime, timezone

    result = await db.execute(
        select(Payment).where(
            Payment.id == payload.payment_id,
            Payment.user_id == current_user.id,
            Payment.status == PaymentStatus.pending,
        )
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise NotFoundError("Платёж не найден или уже проведён")
    if payment.external_id and str(payment.external_id).startswith("cs_"):
        from app.core.exceptions import AppException

        raise AppException(
            "Этот платёж оформляется через Stripe — откройте страницу оплаты Stripe.",
            status_code=400,
        )
    result = await db.execute(
        select(PaymentConfirmCode).where(
            PaymentConfirmCode.payment_id == payload.payment_id,
            PaymentConfirmCode.expires_at > datetime.now(timezone.utc),
        )
    )
    rec = result.scalar_one_or_none()
    if not rec:
        raise ForbiddenError("Код подтверждения истёк. Начните оплату заново.")
    logger.warning(">>> КОД ПОДТВЕРЖДЕНИЯ ОПЛАТЫ (введите на странице): %s <<<", rec.code)
    return {"message": "Код подтверждения отправлен."}


@router.post("/confirm", response_model=dict)
async def confirm_payment(
    payload: ConfirmPaymentRequest,
    current_user: CurrentUser,
    db: DbSession,
):
    """Подтверждение списания по 6-значному коду (тестовый этап: код выводится в лог бэкенда)."""
    payment = await payment_service.confirm_payment_by_code(
        db, payload.payment_id, current_user.id, payload.code
    )
    return {
        "payment_id": payment.id,
        "status": payment.status,
        "message": "Оплата успешно проведена. Подписка активирована.",
    }
