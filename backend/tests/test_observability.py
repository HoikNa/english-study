import sys
from types import SimpleNamespace

from app.config import Settings
from app.observability import init_sentry


def test_sentry_is_disabled_without_dsn():
    settings = Settings(SENTRY_DSN="")

    assert init_sentry(settings) is False


def test_sentry_init_uses_safe_defaults(monkeypatch):
    calls = []
    fake_sentry = SimpleNamespace(init=lambda **kwargs: calls.append(kwargs))
    monkeypatch.setitem(sys.modules, "sentry_sdk", fake_sentry)

    settings = Settings(
        SENTRY_DSN="https://public@example.ingest.sentry.io/1",
        ENVIRONMENT="test",
        SENTRY_TRACES_SAMPLE_RATE=0.25,
    )

    assert init_sentry(settings) is True
    assert calls == [
        {
            "dsn": "https://public@example.ingest.sentry.io/1",
            "environment": "test",
            "traces_sample_rate": 0.25,
            "send_default_pii": False,
        }
    ]
