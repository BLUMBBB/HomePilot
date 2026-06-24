"""Bereke Bank payment callback webhook.

Bereke Bank sends a POST request to this endpoint after each payment attempt.
Signature verification uses HMAC-SHA256 of: merchant_id + order_id + amount + secret_key.
If BEREKE_SECRET_KEY is not set, signature check is skipped (dev/test mode).
"""
import hashlib
import hmac
import json
import logging
from typing import Optional

from fastapi import APIRouter, Header, Request, Response

from app.config import get_settings
from app.core.dependencies import DbSession
from app.services import payment as payment_service

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["webhooks"])


def _verify_signature(
    merchant_id: str,
    order_id: str,
    amount: str,
    signature: str,
    secret_key: str,
) -> bool:
    """HMAC-SHA256 verification: sign(merchant_id + order_id + amount)."""
    message = f"{merchant_id}{order_id}{amount}".encode()
    expected = hmac.new(secret_key.encode(), message, hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected, signature.lower())


@router.post("/bereke")
async def bereke_callback(
    request: Request,
    db: DbSession,
    x_bereke_signature: Optional[str] = Header(None, alias="X-Bereke-Signature"),
):
    """Callback от Bereke Bank.

    Ожидаемый JSON body:
    {
        "order_id": "...",       // наш external_id
        "status": "SUCCESS" | "FAILED" | "REFUNDED",
        "amount": "5000",        // в тенге, строка
        "merchant_id": "..."
    }
    """
    settings = get_settings()
    raw = await request.body()

    try:
        body: dict = json.loads(raw.decode("utf-8"))
    except (json.JSONDecodeError, UnicodeDecodeError):
        logger.warning("Bereke webhook: invalid JSON body")
        return Response(content='{"ok":false,"error":"invalid json"}', status_code=400, media_type="application/json")

    order_id: str = body.get("order_id") or body.get("orderId") or ""
    status_raw: str = (body.get("status") or "").upper()
    amount: str = str(body.get("amount") or "0")
    merchant_id: str = body.get("merchant_id") or body.get("merchantId") or ""

    if not order_id:
        logger.warning("Bereke webhook: missing order_id")
        return Response(content='{"ok":false,"error":"missing order_id"}', status_code=400, media_type="application/json")

    # Signature verification (skipped if secret not configured)
    secret = (settings.BEREKE_SECRET_KEY or "").strip()
    if secret and x_bereke_signature:
        mid = merchant_id or (settings.BEREKE_MERCHANT_ID or "")
        if not _verify_signature(mid, order_id, amount, x_bereke_signature, secret):
            logger.warning("Bereke webhook: invalid signature for order_id=%s", order_id)
            return Response(
                content='{"ok":false,"error":"invalid signature"}',
                status_code=401,
                media_type="application/json",
            )

    # Normalise status → our internal status
    if status_raw in ("SUCCESS", "PAID", "COMPLETED", "00"):
        internal_status = "completed"
    elif status_raw in ("FAILED", "FAIL", "ERROR", "DECLINED"):
        internal_status = "failed"
    elif status_raw in ("REFUNDED", "REFUND"):
        internal_status = "refunded"
    else:
        logger.warning("Bereke webhook: unknown status=%s for order_id=%s", status_raw, order_id)
        internal_status = "failed"

    logger.info("Bereke callback: order_id=%s status=%s->%s", order_id, status_raw, internal_status)

    try:
        await payment_service.handle_payment_webhook(db, order_id, status=internal_status)
    except Exception as exc:  # noqa: BLE001
        logger.error("Bereke webhook: failed to process order_id=%s: %s", order_id, exc)
        return Response(content='{"ok":false,"error":"processing error"}', status_code=500, media_type="application/json")

    return {"ok": True, "order_id": order_id, "status": internal_status}
