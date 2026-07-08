"""Tests for app.services.recaptcha — no-op when unconfigured, score/action checks when configured."""
from app.services import recaptcha


class _FakeSettings:
    def __init__(self, secret: str | None = None, min_score: float = 0.5):
        self.RECAPTCHA_SECRET_KEY = secret
        self.RECAPTCHA_MIN_SCORE = min_score


class _FakeResponse:
    def __init__(self, payload: dict):
        self._payload = payload

    def json(self) -> dict:
        return self._payload


class _FakeAsyncClient:
    def __init__(self, payload: dict):
        self._payload = payload

    async def __aenter__(self):
        return self

    async def __aexit__(self, *exc_info):
        return False

    async def post(self, *args, **kwargs):
        return _FakeResponse(self._payload)


def _patch_verify_response(monkeypatch, payload: dict) -> None:
    monkeypatch.setattr(recaptcha.httpx, "AsyncClient", lambda **kw: _FakeAsyncClient(payload))


async def test_verify_is_noop_when_secret_not_configured(monkeypatch):
    monkeypatch.setattr(recaptcha, "get_settings", lambda: _FakeSettings(secret=None))
    assert await recaptcha.verify(None, "login") is True
    assert await recaptcha.verify("any-token", "register") is True


async def test_verify_rejects_missing_token_when_configured(monkeypatch):
    monkeypatch.setattr(recaptcha, "get_settings", lambda: _FakeSettings(secret="test-secret"))
    assert await recaptcha.verify(None, "login") is False
    assert await recaptcha.verify("", "login") is False


async def test_verify_rejects_low_score(monkeypatch):
    monkeypatch.setattr(recaptcha, "get_settings", lambda: _FakeSettings(secret="test-secret", min_score=0.5))
    _patch_verify_response(monkeypatch, {"success": True, "score": 0.2, "action": "login"})
    assert await recaptcha.verify("token", "login") is False


async def test_verify_rejects_action_mismatch(monkeypatch):
    monkeypatch.setattr(recaptcha, "get_settings", lambda: _FakeSettings(secret="test-secret", min_score=0.5))
    _patch_verify_response(monkeypatch, {"success": True, "score": 0.9, "action": "register"})
    assert await recaptcha.verify("token", "login") is False


async def test_verify_rejects_google_failure(monkeypatch):
    monkeypatch.setattr(recaptcha, "get_settings", lambda: _FakeSettings(secret="test-secret"))
    _patch_verify_response(monkeypatch, {"success": False})
    assert await recaptcha.verify("token", "login") is False


async def test_verify_accepts_high_score_matching_action(monkeypatch):
    monkeypatch.setattr(recaptcha, "get_settings", lambda: _FakeSettings(secret="test-secret", min_score=0.5))
    _patch_verify_response(monkeypatch, {"success": True, "score": 0.9, "action": "login"})
    assert await recaptcha.verify("token", "login") is True
