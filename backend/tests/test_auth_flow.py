import pytest
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.config import get_settings
from app.database import reset_database_state_for_tests
from app.dependencies.auth import get_current_user
from app.routers import auth, sessions
from app.schemas import AuthRequest, SessionCreate


def use_temp_database(monkeypatch, tmp_path):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'auth.sqlite3'}")
    monkeypatch.setenv("JWT_SECRET", "test-secret")
    get_settings.cache_clear()
    reset_database_state_for_tests()


def credentials(token: str) -> HTTPAuthorizationCredentials:
    return HTTPAuthorizationCredentials(scheme="Bearer", credentials=token)


def test_register_login_me_and_protected_session(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    register_res = auth.register(
        AuthRequest(email="learner@example.com", password="password123", nickname="Learner")
    )
    assert register_res.user.email == "learner@example.com"

    current_user = get_current_user(credentials(register_res.access_token))
    assert current_user.nickname == "Learner"
    assert auth.me(current_user).email == "learner@example.com"

    login_res = auth.login(AuthRequest(email="learner@example.com", password="password123"))
    logged_in_user = get_current_user(credentials(login_res.access_token))

    session = sessions.create_session(
        SessionCreate(expression_id="exp-011", total_score=84),
        current_user=logged_in_user,
    )
    assert session.attempt_number == 1

    page = sessions.list_sessions(expression_id="exp-011", skip=0, limit=20, current_user=logged_in_user)
    assert page.total == 1


def test_protected_dependency_rejects_missing_token(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    with pytest.raises(HTTPException) as exc:
        get_current_user(None)

    assert exc.value.status_code == 401
