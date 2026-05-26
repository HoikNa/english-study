from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import initialize_database
from app.observability import init_sentry
from app.routers import ai, auth, expressions, ops, reports, review, sessions


def create_app() -> FastAPI:
    settings = get_settings()
    init_sentry(settings)

    app = FastAPI(title="SpeakReadyMY API", version="0.1.0")
    allow_origins = [origin.strip() for origin in settings.cors_allow_origins.split(",") if origin.strip()]
    if "*" in allow_origins:
        raise RuntimeError(
            "CORS_ALLOW_ORIGINS cannot contain '*' while allow_credentials=True; "
            "set explicit origins instead."
        )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_origin_regex=r"^http://(localhost|127\.0\.0\.1):\d+$",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        return {"status": "ok"}

    @app.on_event("startup")
    def startup() -> None:
        initialize_database()

    app.include_router(auth.router, prefix="/api/v1")
    app.include_router(expressions.router, prefix="/api/v1")
    app.include_router(ai.router, prefix="/api/v1")
    app.include_router(sessions.router, prefix="/api/v1")
    app.include_router(review.router, prefix="/api/v1")
    app.include_router(reports.router, prefix="/api/v1")
    app.include_router(ops.router, prefix="/api/v1")

    return app


app = create_app()
