from datetime import datetime, timezone

from app.config import get_settings
from app.database import reset_database_state_for_tests
from app.schemas import Expression, ReviewQueue, Session
from app.services import repository


def use_temp_database(monkeypatch, tmp_path):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'test.sqlite3'}")
    get_settings.cache_clear()
    reset_database_state_for_tests()


def test_session_persists_after_repository_reinitialization(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    session = repository.create_session(
        Session(
            expression_id="exp-011",
            total_score=82,
            pron_score=80,
            recognized_text="I'd like to walk you through our IoT platform briefly.",
        )
    )

    reset_database_state_for_tests()

    sessions = repository.list_sessions("exp-011")
    assert len(sessions) == 1
    assert sessions[0].id == session.id
    assert sessions[0].attempt_number == 1
    assert sessions[0].total_score == 82


def test_review_queue_persists_after_repository_reinitialization(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    expression = repository.get_expression("exp-011")
    next_review_at = datetime.now(timezone.utc).isoformat()
    queue = repository.upsert_review_queue(
        ReviewQueue(
            expression_id="exp-011",
            expression=expression,
            interval=3,
            repetition=2,
            ef=2.2,
            next_review_at=next_review_at,
            last_score=76,
            total_attempts=4,
        )
    )

    reset_database_state_for_tests()

    persisted = repository.get_review_queue("exp-011")
    assert persisted is not None
    assert persisted.id == queue.id
    assert persisted.interval == 3
    assert persisted.repetition == 2
    assert persisted.ef == 2.2
    assert persisted.last_score == 76
    assert persisted.total_attempts == 4


def test_custom_expression_soft_delete_hides_expression(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    expression = repository.add_expression(
        Expression(
            id="custom-delete-test",
            category="custom",
            situation="Custom",
            situation_ko="삭제 테스트",
            level=2,
            text_en="The timeline needs adjustment.",
            text_ko="일정 조정이 필요해요.",
            chunks=["The timeline", "needs adjustment."],
            is_custom=True,
        )
    )

    assert repository.get_expression(expression.id).id == expression.id

    repository.delete_custom_expression(expression.id)

    assert all(item.id != expression.id for item in repository.list_expressions(category="custom"))
