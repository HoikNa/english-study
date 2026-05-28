import base64
import hashlib
from urllib.parse import quote

from app.config import get_settings


def get_tts_url(text: str, speed: float = 1.0, voice: str | None = None) -> str:
    settings = get_settings()
    effective_voice = voice or settings.openai_tts_voice

    if not settings.openai_api_key:
        encoded = quote(text[:80])
        return f"https://example.com/mock-tts/{encoded}?voice={effective_voice}&speed={speed}"

    cache_key = _cache_key(text, speed, effective_voice)

    cached_url = _check_supabase_cache(cache_key, settings)
    if cached_url:
        return cached_url

    audio_bytes = _generate_tts(text, speed, settings, effective_voice)
    return _upload_to_supabase(cache_key, audio_bytes, settings)


def _cache_key(text: str, speed: float, voice: str) -> str:
    raw = f"{voice}|{text}|{speed:.1f}"
    return hashlib.sha256(raw.encode()).hexdigest()[:32] + ".mp3"


def _check_supabase_cache(cache_key: str, settings) -> str | None:
    if not settings.supabase_url or not settings.supabase_service_key:
        return None

    try:
        from supabase import create_client
        client = create_client(settings.supabase_url, settings.supabase_service_key)
        # list 로 파일 존재 여부 확인
        result = client.storage.from_(settings.supabase_storage_bucket).list(path="")
        existing = [f["name"] for f in (result or [])]
        if cache_key in existing:
            return client.storage.from_(settings.supabase_storage_bucket).get_public_url(cache_key)
    except Exception:
        pass
    return None


def _generate_tts(text: str, speed: float, settings, voice: str) -> bytes:
    from openai import OpenAI
    client = OpenAI(api_key=settings.openai_api_key)
    response = client.audio.speech.create(
        model="tts-1",
        voice=voice,
        input=text,
        speed=speed,
    )
    return response.content


def _upload_to_supabase(cache_key: str, audio_bytes: bytes, settings) -> str:
    if not settings.supabase_url or not settings.supabase_service_key:
        return _audio_data_url(audio_bytes)

    try:
        from supabase import create_client
        client = create_client(settings.supabase_url, settings.supabase_service_key)
        client.storage.from_(settings.supabase_storage_bucket).upload(
            path=cache_key,
            file=audio_bytes,
            file_options={"content-type": "audio/mpeg", "upsert": "true"},
        )
        return client.storage.from_(settings.supabase_storage_bucket).get_public_url(cache_key)
    except Exception:
        return _audio_data_url(audio_bytes)


def _audio_data_url(audio_bytes: bytes) -> str:
    b64 = base64.b64encode(audio_bytes).decode()
    return f"data:audio/mpeg;base64,{b64}"
