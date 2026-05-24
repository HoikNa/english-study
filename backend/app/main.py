from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import initialize_database
from app.routers import ai, auth, expressions, reports, review, sessions


def create_app() -> FastAPI:
    app = FastAPI(title="SpeakReadyMY API", version="0.1.0")

    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "exp://localhost:8081",
            "speakreadymy://",
        ],
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

    return app


app = create_app()
