import sys
from types import SimpleNamespace

import pytest
from fastapi import HTTPException

from app.config import get_settings
from app.routers import ops


def test_sentry_probe_is_hidden_without_token(monkeypatch, tmp_path):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'ops.sqlite3'}")
    monkeypatch.delenv("SENTRY_TEST_TOKEN", raising=False)
    get_settings.cache_clear()

    with pytest.raises(HTTPException) as exc:
        ops.sentry_test()

    assert exc.value.status_code == 404
    get_settings.cache_clear()


def test_sentry_probe_requires_matching_token(monkeypatch, tmp_path):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'ops.sqlite3'}")
    monkeypatch.setenv("SENTRY_TEST_TOKEN", "probe-token")
    monkeypatch.setenv("SENTRY_DSN", "https://public@example.ingest.sentry.io/1")
    get_settings.cache_clear()

    with pytest.raises(HTTPException) as exc:
        ops.sentry_test(x_sentry_test_token="wrong-token")

    assert exc.value.status_code == 403
    get_settings.cache_clear()


def test_sentry_probe_sends_message(monkeypatch, tmp_path):
    calls = []

    def fake_capture_message(message: str, level: str):
        calls.append((message, level))
        return "event-123"

    fake_sentry = SimpleNamespace(
        capture_message=fake_capture_message,
        flush=lambda timeout: calls.append(("flush", timeout)),
    )
    monkeypatch.setitem(sys.modules, "sentry_sdk", fake_sentry)
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'ops.sqlite3'}")
    monkeypatch.setenv("SENTRY_TEST_TOKEN", "probe-token")
    monkeypatch.setenv("SENTRY_DSN", "https://public@example.ingest.sentry.io/1")
    get_settings.cache_clear()

    result = ops.sentry_test(x_sentry_test_token="probe-token")

    assert result == {"status": "sent", "event_id": "event-123"}
    assert calls[0][1] == "info"
    assert calls[1] == ("flush", 2)
    get_settings.cache_clear()
