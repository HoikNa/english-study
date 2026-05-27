import pytest
from fastapi import HTTPException

from app.config import get_settings
from app.dependencies.auth import CurrentUser
from app.database import reset_database_state_for_tests
from app.routers import expressions, review
from app.schemas import (
    CustomExpressionRequest,
    CustomExpressionResult,
    ReviewEnqueueRequest,
    Session,
)
from app.services import gpt_coach, repository


def use_temp_database(monkeypatch, tmp_path):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'expressions.sqlite3'}")
    get_settings.cache_clear()
    reset_database_state_for_tests()


def test_custom_expression_create_and_soft_delete(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    monkeypatch.setattr(
        gpt_coach,
        "convert_custom_expression",
        lambda text_ko, context: CustomExpressionResult(
            text_en="The timeline needs adjustment.",
            situation_desc_ko="일정 조정이 필요한 상황입니다.",
            level=2,
            category="business",
        ),
    )

    repository.create_user("owner-user", "owner@example.com", "Owner", "hash")
    user = CurrentUser(id="owner-user", email="owner@example.com", nickname="Owner")

    created = expressions.create_custom_expression(
        CustomExpressionRequest(text_ko="일정 조정이 필요해요.", context="파트너 미팅"),
        current_user=user,
    )

    assert created.is_custom is True
    assert repository.get_expression(created.id).text_en == "The timeline needs adjustment."

    expressions.delete_custom_expression(created.id, current_user=user)

    with pytest.raises(HTTPException) as exc:
        repository.get_expression(created.id)

    assert exc.value.status_code == 404


def test_custom_expression_create_uses_selected_converted_text(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    monkeypatch.setattr(
        gpt_coach,
        "convert_custom_expression",
        lambda text_ko, context: (_ for _ in ()).throw(AssertionError("GPT conversion should not run")),
    )

    repository.create_user("preview-user", "preview@example.com", "Preview", "hash")
    user = CurrentUser(id="preview-user", email="preview@example.com", nickname="Preview")

    created = expressions.create_custom_expression(
        CustomExpressionRequest(
            text_ko="일정 조정이 필요해요.",
            context="파트너 미팅",
            text_en="The timeline needs adjustment.",
            situation_desc_ko="선택한 변환 문장입니다.",
            level=2,
            category="custom",
        ),
        current_user=user,
    )

    assert created.text_en == "The timeline needs adjustment."
    assert created.situation_ko == "선택한 변환 문장입니다."
    assert created.level == 2


def test_delete_custom_expression_removes_review_queue_entry(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    repository.create_user("cleanup-user", "cleanup@example.com", "Cleanup", "hash")
    user = CurrentUser(id="cleanup-user", email="cleanup@example.com", nickname="Cleanup")

    created = expressions.create_custom_expression(
        CustomExpressionRequest(
            text_ko="회의 일정 다시 잡고 싶어요.",
            text_en="Can we reschedule the meeting?",
            situation_desc_ko="회의 일정 재조율 요청 상황입니다.",
            level=2,
        ),
        current_user=user,
    )

    review.enqueue(created.id, ReviewEnqueueRequest(score=60), current_user=user)
    assert repository.get_review_queue(created.id, user_id=user.id) is not None

    expressions.delete_custom_expression(created.id, current_user=user)

    assert repository.get_review_queue(created.id, user_id=user.id) is None
    assert all(item.expression_id != created.id for item in repository.due_review_items(user.id))


def test_delete_custom_expression_rejects_other_owner(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    repository.create_user("owner-a", "a@example.com", "A", "hash")
    repository.create_user("attacker-b", "b@example.com", "B", "hash")
    owner = CurrentUser(id="owner-a", email="a@example.com", nickname="A")
    attacker = CurrentUser(id="attacker-b", email="b@example.com", nickname="B")

    created = expressions.create_custom_expression(
        CustomExpressionRequest(
            text_ko="회의 일정 다시 잡고 싶어요.",
            text_en="Can we reschedule the meeting?",
            situation_desc_ko="회의 일정 재조율 요청 상황입니다.",
            level=2,
        ),
        current_user=owner,
    )

    with pytest.raises(HTTPException) as exc:
        expressions.delete_custom_expression(created.id, current_user=attacker)

    assert exc.value.status_code == 403
    assert repository.get_expression(created.id).id == created.id


def test_today_expression_skips_practiced_expression(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    repository.create_user("today-user", "today@example.com", "Today", "hash")
    user = CurrentUser(id="today-user", email="today@example.com", nickname="Today")
    first = expressions.today_expression(current_user=user)

    repository.create_session(Session(expression_id=first.id, total_score=90), user_id=user.id)
    recommended = expressions.today_expression(current_user=user)

    assert recommended.id != first.id
