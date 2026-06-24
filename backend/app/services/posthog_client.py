"""PostHog server-side analytics — graceful no-op when key not set."""
import asyncio
import logging
from typing import Any, Optional

from app.config import get_settings

logger = logging.getLogger(__name__)

_client: Optional[Any] = None
_initialized = False


def _get_client() -> Optional[Any]:
    global _client, _initialized
    if _initialized:
        return _client
    _initialized = True
    settings = get_settings()
    api_key = (settings.POSTHOG_API_KEY or "").strip()
    if not api_key:
        logger.debug("POSTHOG_API_KEY not set — server-side analytics disabled")
        return None
    try:
        import posthog as ph
        ph.project_api_key = api_key
        ph.host = settings.POSTHOG_HOST
        ph.on_error = lambda error, items: logger.warning("PostHog error: %s", error)
        _client = ph
        logger.info("PostHog server-side analytics initialised (host=%s)", settings.POSTHOG_HOST)
    except ImportError:
        logger.warning("posthog package not installed — server-side analytics disabled")
    return _client


async def capture(distinct_id: str, event: str, properties: Optional[dict] = None) -> None:
    """Capture a server-side PostHog event. Never raises."""
    client = _get_client()
    if client is None:
        return
    try:
        await asyncio.to_thread(client.capture, distinct_id, event, properties or {})
    except Exception as exc:  # noqa: BLE001
        logger.warning("PostHog capture failed event=%s: %s", event, exc)
