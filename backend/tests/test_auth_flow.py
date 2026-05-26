import pytest
from datetime import timedelta
from fastapi import HTTPException
from fastapi.security import HTTPAuthorizationCredentials

from app.config import get_settings
from app.database import reset_database_state_for_tests
from app.dependencies.auth import get_current_user
from app.routers import auth, review, sessions
from app.schemas import AuthRequest, RefreshRequest, ReviewEnqueueRequest, ReviewUpdateRequest, SessionCreate, utc_now
from app.services import repository
from app.services.azure_speech import _prepare_wav_audio, assess_pronunciation


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
    assert register_res.refresh_token

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


def test_low_score_session_can_enqueue_review(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    register_res = auth.register(
        AuthRequest(email="review-low@example.com", password="password123", nickname="LowScore")
    )
    current_user = get_current_user(credentials(register_res.access_token))

    session = sessions.create_session(
        SessionCreate(expression_id="exp-011", total_score=55, pron_score=55),
        current_user=current_user,
    )
    queued = review.enqueue("exp-011", ReviewEnqueueRequest(score=session.total_score), current_user=current_user)
    today = review.today(current_user=current_user)

    assert session.total_score == 55
    assert queued.expression_id == "exp-011"
    assert queued.last_score == 55
    assert today.count == 1
    assert today.items[0].expression_id == "exp-011"


def test_review_enqueue_uses_actual_session_score(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    register_res = auth.register(
        AuthRequest(email="review-actual@example.com", password="password123", nickname="ActualScore")
    )
    current_user = get_current_user(credentials(register_res.access_token))

    queued = review.enqueue("exp-011", ReviewEnqueueRequest(score=82.1), current_user=current_user)

    assert queued.last_score == 82.1
    assert queued.repetition == 1
    assert queued.interval == 1


def test_review_update_preserves_selected_score(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    register_res = auth.register(
        AuthRequest(email="review-update@example.com", password="password123", nickname="ReviewUpdate")
    )
    current_user = get_current_user(credentials(register_res.access_token))
    review.enqueue("exp-011", current_user=current_user)

    updated = review.update_review(
        "exp-011",
        ReviewUpdateRequest(
            grade=3,
            score=76,
            repetition=1,
            interval_days=1,
            ease_factor=2.36,
            next_review_at=(utc_now() + timedelta(days=1)).isoformat(),
        ),
        current_user=current_user,
    )
    today = review.today(current_user=current_user)

    assert updated.last_score == 76
    assert updated.repetition == 1
    assert updated.interval == 1
    assert updated.ef == 2.36
    assert today.count == 1
    assert today.items[0].expression_id == "exp-011"


def test_azure_pronunciation_rejects_compressed_audio_without_conversion(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)
    monkeypatch.setenv("AZURE_SPEECH_KEY", "dummy")
    monkeypatch.setenv("FFMPEG_BINARY", "missing-ffmpeg")
    get_settings.cache_clear()

    with pytest.raises(HTTPException) as exc:
        assess_pronunciation(b"ID3 fake mp3 data", "Hello")

    assert exc.value.status_code == 415


def test_compressed_audio_can_be_converted_to_wav(monkeypatch):
    wav_bytes = b"RIFF\x24\x00\x00\x00WAVEfmt "

    class FakeCompletedProcess:
        stdout = wav_bytes

    monkeypatch.setattr("app.services.azure_speech.shutil.which", lambda _: "/usr/bin/ffmpeg")
    monkeypatch.setattr("app.services.azure_speech.subprocess.run", lambda *args, **kwargs: FakeCompletedProcess())

    assert _prepare_wav_audio(b"ID3 fake mp3 data", "ffmpeg") == wav_bytes


def test_refresh_token_issues_new_access_token(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    register_res = auth.register(
        AuthRequest(email="refresh@example.com", password="password123", nickname="Refresh")
    )

    refresh_res = auth.refresh(RefreshRequest(refresh_token=register_res.refresh_token))
    current_user = get_current_user(credentials(refresh_res["access_token"]))

    assert current_user.email == "refresh@example.com"
    assert refresh_res["refresh_token"]
    assert refresh_res["refresh_token"] != register_res.refresh_token


def test_refresh_token_is_rotated_and_old_token_is_rejected(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    register_res = auth.register(
        AuthRequest(email="rotate@example.com", password="password123", nickname="Rotate")
    )

    refresh_res = auth.refresh(RefreshRequest(refresh_token=register_res.refresh_token))

    with pytest.raises(HTTPException) as exc:
        auth.refresh(RefreshRequest(refresh_token=register_res.refresh_token))

    assert exc.value.status_code == 401

    with pytest.raises(HTTPException) as second_exc:
        auth.refresh(RefreshRequest(refresh_token=refresh_res["refresh_token"]))

    assert second_exc.value.status_code == 401


def test_logout_revokes_refresh_tokens(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    register_res = auth.register(
        AuthRequest(email="logout@example.com", password="password123", nickname="Logout")
    )
    current_user = get_current_user(credentials(register_res.access_token))

    auth.logout(current_user)

    with pytest.raises(HTTPException) as exc:
        auth.refresh(RefreshRequest(refresh_token=register_res.refresh_token))

    assert exc.value.status_code == 401


def test_delete_me_removes_account_data_and_invalidates_tokens(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    register_res = auth.register(
        AuthRequest(email="delete-me@example.com", password="password123", nickname="DeleteMe")
    )
    current_user = get_current_user(credentials(register_res.access_token))

    sessions.create_session(
        SessionCreate(expression_id="exp-011", total_score=61),
        current_user=current_user,
    )
    review.enqueue("exp-011", ReviewEnqueueRequest(score=61), current_user=current_user)

    auth.delete_me(current_user)

    assert repository.get_user_by_id(current_user.id) is None
    assert repository.list_sessions(user_id=current_user.id) == []
    assert repository.get_review_queue("exp-011", user_id=current_user.id) is None

    with pytest.raises(HTTPException) as access_exc:
        get_current_user(credentials(register_res.access_token))
    assert access_exc.value.status_code == 401

    with pytest.raises(HTTPException) as refresh_exc:
        auth.refresh(RefreshRequest(refresh_token=register_res.refresh_token))
    assert refresh_exc.value.status_code == 401


def test_export_me_returns_account_scoped_learning_data(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    register_res = auth.register(
        AuthRequest(email="export-me@example.com", password="password123", nickname="ExportMe")
    )
    current_user = get_current_user(credentials(register_res.access_token))

    sessions.create_session(
        SessionCreate(expression_id="exp-011", total_score=88, recognized_text="I'd like to practice."),
        current_user=current_user,
    )
    review.enqueue("exp-011", ReviewEnqueueRequest(score=72), current_user=current_user)

    exported = auth.export_me(current_user)

    assert exported.user.email == "export-me@example.com"
    assert [session.expression_id for session in exported.sessions] == ["exp-011"]
    assert [item.expression_id for item in exported.review_queue] == ["exp-011"]
    assert exported.sessions[0].recognized_text == "I'd like to practice."


def test_refresh_rejects_access_token(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    register_res = auth.register(
        AuthRequest(email="wrong-token@example.com", password="password123", nickname="WrongToken")
    )

    with pytest.raises(HTTPException) as exc:
        auth.refresh(RefreshRequest(refresh_token=register_res.access_token))

    assert exc.value.status_code == 401


def test_protected_dependency_rejects_missing_token(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    with pytest.raises(HTTPException) as exc:
        get_current_user(None)

    assert exc.value.status_code == 401
