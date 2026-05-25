"""Webhook: Stripe (подпись) или legacy JSON (mock / тесты)."""
import json
import logging

from fastapi import APIRouter, Header, Request, Response

from app.config import get_settings
from app.core.dependencies import DbSession
from app.services import payment as payment_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _stripe_event_to_dict(event) -> dict:
    if isinstance(event, dict):
        return event
    if hasattr(event, "to_dict") and callable(event.to_dict):
        return event.to_dict()
    return {"type": getattr(event, "type", None), "data": getattr(event, "data", None)}


@router.post("/payment")
async def payment_webhook(
    request: Request,
    db: DbSession,
    stripe_signature: str | None = Header(None, alias="Stripe-Signature"),
):
    settings = get_settings()
    raw = await request.body()
    wh_secret = (settings.STRIPE_WEBHOOK_SECRET or "").strip()

    if wh_secret and stripe_signature:
        import stripe

        stripe.api_key = (settings.STRIPE_SECRET_KEY or "").strip()
        try:
            event = stripe.Webhook.construct_event(payload=raw, sig_header=stripe_signature, secret=wh_secret)
        except Exception as exc:  # noqa: BLE001
            logger.warning("stripe webhook signature failed: %s", exc)
            return Response(
                content=json.dumps({"ok": False, "error": "invalid signature"}),
                status_code=400,
                media_type="application/json",
            )
        payload_dict = _stripe_event_to_dict(event)
        await payment_service.handle_stripe_webhook_event(db, payload_dict)
        return {"ok": True}

    if wh_secret and not stripe_signature:
        return Response(
            content=json.dumps({"ok": False, "error": "missing Stripe-Signature"}),
            status_code=401,
            media_type="application/json",
        )

    # Legacy JSON (mock provider / smoke tests)
    try:
        body = json.loads(raw.decode("utf-8") or "{}")
    except json.JSONDecodeError:
        return Response(content=json.dumps({"ok": False}), status_code=400, media_type="application/json")
    external_id = body.get("external_id") or body.get("payment_id") or body.get("id")
    status = body.get("status", "completed")
    if not external_id:
        return {"ok": False, "error": "missing external_id"}
    await payment_service.handle_payment_webhook(db, str(external_id), status=status)
    return {"ok": True}
