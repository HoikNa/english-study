from urllib.parse import quote


def get_tts_url(text: str, speed: float = 1.0) -> str:
    encoded = quote(text[:80])
    return f"https://example.com/mock-tts/{encoded}?speed={speed}"

