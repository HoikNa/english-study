from app.config import Settings


def init_sentry(settings: Settings) -> bool:
    if not settings.sentry_dsn:
        return False

    try:
        import sentry_sdk  # type: ignore[import-untyped]
    except ImportError as exc:
        raise RuntimeError("sentry-sdk is required when SENTRY_DSN is set") from exc

    sentry_sdk.init(
        dsn=settings.sentry_dsn,
        environment=settings.environment,
        traces_sample_rate=settings.sentry_traces_sample_rate,
        send_default_pii=False,
    )
    return True
