"""Google reCAPTCHA v3 server-side verification — graceful no-op when secret not set."""
import logging

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify"


async def verify(token: str | None, action: str) -> bool:
    """Verify a reCAPTCHA v3 token for the given action.

    Returns True when RECAPTCHA_SECRET_KEY is not configured (dev/tests), so
    the check is opt-in and never blocks environments without a key.
    """
    settings = get_settings()
    secret = (settings.RECAPTCHA_SECRET_KEY or "").strip()
    if not secret:
        return True
    if not token:
        return False
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                VERIFY_URL, data={"secret": secret, "response": token}
            )
        data = resp.json()
    except Exception as exc:  # noqa: BLE001
        logger.warning("reCAPTCHA verify request failed: %s", exc)
        return False

    if not data.get("success"):
        return False
    if data.get("action") and data["action"] != action:
        return False
    return float(data.get("score", 0)) >= settings.RECAPTCHA_MIN_SCORE
