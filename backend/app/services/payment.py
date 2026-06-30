"""Payment service: mock (код), Stripe Checkout, webhook, fallback complete."""
import asyncio
import logging
import secrets
from datetime import datetime, timedelta, timezone
from uuid import UUID

import stripe
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.models import Payment, Subscription, User
from app.models.payment import PaymentStatus
from app.models.payment_confirm_code import PaymentConfirmCode
from app.models.subscription import SubscriptionStatus
from app.services.subscription import activate_subscription

logger = logging.getLogger(__name__)


async def _generate_payment_confirm_code(db: AsyncSession, payment_id: UUID) -> str:
    """Генерирует 6-значный код подтверждения списания и сохраняет в БД."""
    settings = get_settings()
    expires_at = datetime.now(timezone.utc) + timedelta(
        minutes=settings.PAYMENT_CONFIRM_CODE_EXPIRE_MINUTES
    )
    await db.execute(delete(PaymentConfirmCode).where(PaymentConfirmCode.payment_id == payment_id))
    for _ in range(10):
        code = "".join(secrets.choice("0123456789") for _ in range(6))
        existing = await db.execute(select(PaymentConfirmCode).where(PaymentConfirmCode.code == code))
        if existing.scalar_one_or_none():
            continue
        rec = PaymentConfirmCode(code=code, payment_id=payment_id, expires_at=expires_at)
        db.add(rec)
        await db.flush()
        return code
    raise RuntimeError("Не удалось сгенерировать уникальный код подтверждения оплаты")


def _absolute_url(path_or_url: str, settings) -> str:
    p = (path_or_url or "").strip()
    if not p:
        p = "/dashboard/slots"
    if p.startswith("http://") or p.startswith("https://"):
        return p
    base = settings.FRONTEND_BASE_URL.rstrip("/")
    return f"{base}/{p.lstrip('/')}"


def _stripe_success_url(return_url: str | None, settings) -> str:
    """Stripe подставляет session id вместо литерала {CHECKOUT_SESSION_ID}."""
    base = _absolute_url(return_url or "/dashboard/slots?payment=success", settings)
    if "{CHECKOUT_SESSION_ID}" in base:
        return base
    sep = "&" if "?" in base else "?"
    return f"{base}{sep}session_id={{CHECKOUT_SESSION_ID}}"


def _stripe_cancel_url(cancel_url: str | None, settings) -> str:
    return _absolute_url(cancel_url or "/booking", settings)


async def _finalize_paid_payment(db: AsyncSession, payment: Payment) -> Payment:
    """Идемпотентно: completed + активация подписки."""
    if payment.status == PaymentStatus.completed:
        await db.refresh(payment)
        return payment
    payment.status = PaymentStatus.completed
    payment.paid_at = datetime.now(timezone.utc)
    if payment.subscription_id:
        await activate_subscription(db, payment.subscription_id)
    await db.flush()
    await db.refresh(payment)
    return payment


async def create_payment_intent(
    db: AsyncSession,
    subscription_id,
    user_id,
    return_url: str | None = None,
    cancel_url: str | None = None,
) -> tuple[Payment, str | None, str | None, str]:
    """Создаёт платёж pending. mock — код в БД + redirect на ЛК; stripe — Checkout URL.

    Для KZT в Stripe unit_amount задаётся в тыйынах (×100 от тенге).
    Возвращает (payment, redirect_url, confirm_code|None, provider mock|stripe).
    """
    settings = get_settings()
    result = await db.execute(
        select(Subscription).where(
            Subscription.id == subscription_id,
            Subscription.user_id == user_id,
            Subscription.status == SubscriptionStatus.draft,
        )
    )
    sub = result.scalar_one_or_none()
    if not sub:
        from app.core.exceptions import NotFoundError

        raise NotFoundError("Подписка не найдена")
    from app.services.subscription import get_price_for_subscription

    amount = await get_price_for_subscription(db, sub.tariff_id, sub.apartment_type_id)
    if not amount:
        from app.core.exceptions import AppException

        raise AppException("Не удалось определить сумму", status_code=400)

    payment = Payment(
        user_id=user_id,
        subscription_id=subscription_id,
        amount_kzt=amount,
        status=PaymentStatus.pending,
        external_id=None,
    )
    db.add(payment)
    await db.flush()
    await db.refresh(payment)

    use_stripe = (settings.PAYMENT_PROVIDER or "").lower() == "stripe" and bool(
        (settings.STRIPE_SECRET_KEY or "").strip()
    )
    if use_stripe:
        user = await db.get(User, user_id)
        if not user:
            from app.core.exceptions import NotFoundError

            raise NotFoundError("Пользователь не найден")

        stripe.api_key = settings.STRIPE_SECRET_KEY
        success_url = _stripe_success_url(return_url, settings)
        cancel_u = _stripe_cancel_url(cancel_url, settings)
        # Stripe: KZT — минимальная единица тыйын (1/100 тенге)
        unit_amount_tiyin = int(amount) * 100

        def _create_session():
            return stripe.checkout.Session.create(
                mode="payment",
                client_reference_id=str(payment.id),
                customer_email=user.email if getattr(user, "email", None) else None,
                line_items=[
                    {
                        "price_data": {
                            "currency": "kzt",
                            "product_data": {"name": "Подписка HomePilot (1 мес.)"},
                            "unit_amount": unit_amount_tiyin,
                        },
                        "quantity": 1,
                    }
                ],
                metadata={
                    "payment_id": str(payment.id),
                    "user_id": str(user_id),
                    "subscription_id": str(subscription_id),
                },
                success_url=success_url,
                cancel_url=cancel_u,
            )

        session = await asyncio.to_thread(_create_session)
        payment.external_id = session.id
        await db.flush()
        await db.refresh(payment)
        logger.info("stripe checkout created payment_id=%s session=%s amount_kzt=%s", payment.id, session.id, amount)
        return payment, session.url, None, "stripe"

    payment.external_id = "mock_" + str(subscription_id)[:8]
    await db.flush()
    await db.refresh(payment)

    confirm_code = await _generate_payment_confirm_code(db, payment.id)
    logger.warning(">>> КОД ПОДТВЕРЖДЕНИЯ ОПЛАТЫ (введите на странице): %s <<<", confirm_code)

    redirect_url = return_url or f"/payment/complete?payment_id={payment.id}"
    return payment, redirect_url, confirm_code, "mock"


async def complete_stripe_checkout_session(
    db: AsyncSession,
    user_id: UUID,
    session_id: str,
) -> Payment:
    """После возврата из Stripe: проверка session в API и активация (если webhook не успел)."""
    settings = get_settings()
    if not (settings.STRIPE_SECRET_KEY or "").strip():
        from app.core.exceptions import AppException

        raise AppException("Stripe не настроен", status_code=503)

    stripe.api_key = settings.STRIPE_SECRET_KEY
    session = await asyncio.to_thread(stripe.checkout.Session.retrieve, session_id)
    if getattr(session, "payment_status", None) != "paid":
        from app.core.exceptions import AppException

        raise AppException("Оплата в Stripe ещё не завершена", status_code=400)

    raw_meta = getattr(session, "metadata", None)
    meta: dict = raw_meta if isinstance(raw_meta, dict) else (dict(raw_meta) if raw_meta is not None else {})
    pid = meta.get("payment_id") or getattr(session, "client_reference_id", None)
    if not pid:
        from app.core.exceptions import AppException

        raise AppException("Не удалось сопоставить платёж со сессией", status_code=400)

    result = await db.execute(select(Payment).where(Payment.id == UUID(str(pid))))
    payment = result.scalar_one_or_none()
    if not payment or payment.user_id != user_id:
        from app.core.exceptions import ForbiddenError

        raise ForbiddenError("Платёж не найден или не принадлежит вам")

    payment.external_id = session_id
    await db.flush()
    return await _finalize_paid_payment(db, payment)


async def handle_stripe_webhook_event(db: AsyncSession, event: dict) -> None:
    settings = get_settings()
    if event.get("type") != "checkout.session.completed":
        logger.info("stripe webhook ignored type=%s", event.get("type"))
        return
    data = event.get("data") or {}
    obj = (data.get("object") if isinstance(data, dict) else None) or {}
    sid = obj.get("id")
    if not sid or obj.get("payment_status") != "paid":
        return
    result = await db.execute(select(Payment).where(Payment.external_id == sid))
    payment = result.scalar_one_or_none()
    if not payment and (settings.STRIPE_SECRET_KEY or "").strip():
        stripe.api_key = settings.STRIPE_SECRET_KEY
        sess = await asyncio.to_thread(stripe.checkout.Session.retrieve, sid)
        raw_meta = getattr(sess, "metadata", None)
        meta_fb: dict = raw_meta if isinstance(raw_meta, dict) else (dict(raw_meta) if raw_meta is not None else {})
        pid = meta_fb.get("payment_id")
        if pid:
            res = await db.execute(select(Payment).where(Payment.id == UUID(str(pid))))
            payment = res.scalar_one_or_none()
            if payment:
                payment.external_id = sid
                await db.flush()
    if not payment:
        logger.warning("stripe webhook: no payment for session_id=%s", sid)
        return
    await _finalize_paid_payment(db, payment)
    logger.info("stripe webhook completed payment_id=%s session=%s", payment.id, sid)


async def confirm_payment_by_code(
    db: AsyncSession,
    payment_id: UUID,
    user_id: UUID,
    code: str,
) -> Payment:
    """Подтверждение списания по 6-значному коду (тестовый платёж)."""
    from app.core.exceptions import ForbiddenError, NotFoundError

    code = code.strip()
    if len(code) != 6 or not code.isdigit():
        raise ForbiddenError("Неверный формат кода. Введите 6 цифр из SMS/приложения банка.")

    result = await db.execute(
        select(PaymentConfirmCode).where(
            PaymentConfirmCode.code == code,
            PaymentConfirmCode.expires_at > datetime.now(timezone.utc),
        )
    )
    rec = result.scalar_one_or_none()
    if not rec or str(rec.payment_id) != str(payment_id):
        raise ForbiddenError("Недействительный или просроченный код подтверждения оплаты.")

    result = await db.execute(
        select(Payment).where(
            Payment.id == payment_id,
            Payment.user_id == user_id,
            Payment.status == PaymentStatus.pending,
        )
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise NotFoundError("Платёж не найден или уже проведён.")

    payment.status = PaymentStatus.completed
    payment.paid_at = datetime.now(timezone.utc)
    if payment.subscription_id:
        await activate_subscription(db, payment.subscription_id)
    await db.execute(delete(PaymentConfirmCode).where(PaymentConfirmCode.code == code))
    await db.flush()
    await db.refresh(payment)
    return payment


async def handle_payment_webhook(
    db: AsyncSession,
    external_id: str,
    status: str = "completed",
) -> Payment | None:
    """Legacy JSON webhook (mock) или совместимость по external_id."""
    if status != "completed":
        return None
    result = await db.execute(select(Payment).where(Payment.external_id == external_id))
    payment = result.scalar_one_or_none()
    if not payment or payment.status == PaymentStatus.completed:
        return payment
    return await _finalize_paid_payment(db, payment)
