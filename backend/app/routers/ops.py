from datetime import datetime, timezone

from fastapi import APIRouter, Header, HTTPException, status

from app.config import get_settings

router = APIRouter(prefix="/ops", tags=["ops"])


@router.post("/sentry-test")
def sentry_test(x_sentry_test_token: str | None = Header(default=None)) -> dict[str, str]:
    settings = get_settings()
    if not settings.sentry_test_token:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Not found")
    if x_sentry_test_token != settings.sentry_test_token:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")
    if not settings.sentry_dsn:
        raise HTTPException(status_code=status.HTTP_503_SERVICE_UNAVAILABLE, detail="Sentry is not configured")

    import sentry_sdk

    event_id = sentry_sdk.capture_message(
        f"SpeakReadyMY backend Sentry probe {datetime.now(timezone.utc).isoformat()}",
        level="info",
    )
    sentry_sdk.flush(timeout=2)
    return {"status": "sent", "event_id": str(event_id)}
