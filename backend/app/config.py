from functools import lru_cache
from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    environment: str = Field(default="development", alias="ENVIRONMENT")
    database_url: str = Field(default="sqlite:///./backend/.data/speakready.sqlite3", alias="DATABASE_URL")
    jwt_secret: str = Field(default="dev-secret", alias="JWT_SECRET")
    jwt_algorithm: str = Field(default="HS256", alias="JWT_ALGORITHM")
    jwt_expire_minutes: int = Field(default=1440, alias="JWT_EXPIRE_MINUTES")
    openai_gpt_model: str = Field(default="gpt-4o", alias="OPENAI_GPT_MODEL")
    openai_tts_voice: str = Field(default="nova", alias="OPENAI_TTS_VOICE")
    gpt_monthly_budget_usd: float = Field(default=30, alias="GPT_MONTHLY_BUDGET_USD")
    gemini_fallback_enabled: bool = Field(default=True, alias="GEMINI_FALLBACK_ENABLED")


@lru_cache
def get_settings() -> Settings:
    return Settings()
