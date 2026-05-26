import sys
from types import SimpleNamespace

from app.config import get_settings


def test_settings_overlay_runtime_secret(monkeypatch):
    class FakeSecretsClient:
        def get_secret_value(self, SecretId: str):
            assert SecretId == "secret-arn"
            return {
                "SecretString": (
                    '{"DATABASE_URL":"postgresql://secret-db",'
                    '"JWT_SECRET":"secret-jwt",'
                    '"OPENAI_API_KEY":"secret-openai",'
                    '"SUPABASE_SERVICE_KEY":"secret-supabase",'
                    '"SENTRY_DSN":"https://public@example.ingest.sentry.io/1",'
                    '"SENTRY_TEST_TOKEN":"probe-token"}'
                )
            }

    fake_boto3 = SimpleNamespace(client=lambda service: FakeSecretsClient())
    monkeypatch.setitem(sys.modules, "boto3", fake_boto3)
    monkeypatch.setenv("APP_SECRET_ID", "secret-arn")
    monkeypatch.setenv("DATABASE_URL", "sqlite:///local.sqlite3")
    monkeypatch.setenv("JWT_SECRET", "local-jwt")
    get_settings.cache_clear()

    settings = get_settings()

    assert settings.database_url == "postgresql://secret-db"
    assert settings.jwt_secret == "secret-jwt"
    assert settings.openai_api_key == "secret-openai"
    assert settings.supabase_service_key == "secret-supabase"
    assert settings.sentry_dsn == "https://public@example.ingest.sentry.io/1"
    assert settings.sentry_test_token == "probe-token"

    get_settings.cache_clear()
