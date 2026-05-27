from functools import lru_cache
import json
from pathlib import Path
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

_BACKEND_DIR = Path(__file__).resolve().parents[1]
_PROJECT_DIR = _BACKEND_DIR.parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=(
            _PROJECT_DIR / ".env",
            _PROJECT_DIR / ".env.local",
            _BACKEND_DIR / ".env",
            _BACKEND_DIR / ".env.local",
        ),
        env_ignore_empty=True,
        extra="ignore",
    )

    environment: str = Field(default="development", alias="ENVIRONMENT")
    database_url: str = Field(default="sqlite:///./backend/.data/speakready.sqlite3", alias="DATABASE_URL")
    jwt_secret: str = Field(default="dev-secret", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_expire_minutes: int = Field(default=1440, alias="JWT_EXPIRE_MINUTES")
    jwt_refresh_expire_minutes: int = Field(default=43200, alias="JWT_REFRESH_EXPIRE_MINUTES")
    cors_allow_origins: str = Field(default="exp://localhost:8081,speakready://", alias="CORS_ALLOW_ORIGINS")
    app_secret_id: str | None = Field(default=None, alias="APP_SECRET_ID")

    # Azure Speech
    azure_speech_key: str | None = Field(default=None, alias="AZURE_SPEECH_KEY")
    azure_speech_region: str = Field(default="eastus", alias="AZURE_SPEECH_REGION")
    ffmpeg_binary: str = Field(default="ffmpeg", alias="FFMPEG_BINARY")
    azure_min_duration_sec: float = Field(default=1.0, alias="AZURE_MIN_DURATION_SEC")
    azure_min_rms: float = Field(default=20.0, alias="AZURE_MIN_RMS")

    # OpenAI
    openai_api_key: str | None = Field(default=None, alias="OPENAI_API_KEY")
    openai_gpt_model: str = Field(default="gpt-4o", alias="OPENAI_GPT_MODEL")
    openai_feedback_model: str = Field(default="gpt-4.1-nano", alias="OPENAI_FEEDBACK_MODEL")
    openai_tts_voice: str = Field(default="nova", alias="OPENAI_TTS_VOICE")

    # Supabase
    supabase_url: str | None = Field(default=None, alias="SUPABASE_URL")
    supabase_service_key: str | None = Field(default=None, alias="SUPABASE_SERVICE_KEY")
    supabase_storage_bucket: str = Field(default="tts-cache", alias="SUPABASE_STORAGE_BUCKET")

    gpt_monthly_budget_usd: float = Field(default=30, alias="GPT_MONTHLY_BUDGET_USD")
    ai_rate_limit_window_seconds: int = Field(default=60, alias="AI_RATE_LIMIT_WINDOW_SECONDS")
    ai_rate_limit_max_requests: int = Field(default=30, alias="AI_RATE_LIMIT_MAX_REQUESTS")
    sentry_dsn: str | None = Field(default=None, alias="SENTRY_DSN")
    sentry_traces_sample_rate: float = Field(default=0.05, alias="SENTRY_TRACES_SAMPLE_RATE")
    sentry_test_token: str | None = Field(default=None, alias="SENTRY_TEST_TOKEN")


_SECRET_FIELD_MAP = {
    "DATABASE_URL": "database_url",
    "JWT_SECRET": "jwt_secret",
    "AZURE_SPEECH_KEY": "azure_speech_key",
    "OPENAI_API_KEY": "openai_api_key",
    "SUPABASE_URL": "supabase_url",
    "SUPABASE_SERVICE_KEY": "supabase_service_key",
    "SENTRY_DSN": "sentry_dsn",
    "SENTRY_TEST_TOKEN": "sentry_test_token",
}


def _load_secret_values(secret_id: str) -> dict[str, str]:
    try:
        import boto3  # type: ignore[import-untyped]
        from botocore.config import Config  # type: ignore[import-untyped]
    except ImportError as exc:
        raise RuntimeError("boto3 is required to load APP_SECRET_ID") from exc

    client = boto3.client(
        "secretsmanager",
        config=Config(
            connect_timeout=2,
            read_timeout=3,
            retries={"max_attempts": 2, "mode": "standard"},
        ),
    )
    response = client.get_secret_value(SecretId=secret_id)
    secret_string = response.get("SecretString")
    if not secret_string:
        return {}

    values = json.loads(secret_string)
    if not isinstance(values, dict):
        raise RuntimeError("APP_SECRET_ID must contain a JSON object")

    return {key: str(value) for key, value in values.items() if value not in (None, "")}


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if not settings.app_secret_id:
        return settings

    secret_values = _load_secret_values(settings.app_secret_id)
    updates = {
        field_name: secret_values[secret_key]
        for secret_key, field_name in _SECRET_FIELD_MAP.items()
        if secret_key in secret_values
    }
    return settings.model_copy(update=updates)
