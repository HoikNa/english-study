import pytest
from fastapi import HTTPException

from app.config import get_settings
from app.dependencies.auth import CurrentUser
from app.database import reset_database_state_for_tests
from app.routers import expressions
from app.schemas import CustomExpressionRequest, CustomExpressionResult, Session
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

    created = expressions.create_custom_expression(
        CustomExpressionRequest(text_ko="일정 조정이 필요해요.", context="파트너 미팅")
    )

    assert created.is_custom is True
    assert repository.get_expression(created.id).text_en == "The timeline needs adjustment."

    expressions.delete_custom_expression(created.id)

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

    created = expressions.create_custom_expression(
        CustomExpressionRequest(
            text_ko="일정 조정이 필요해요.",
            context="파트너 미팅",
            text_en="The timeline needs adjustment.",
            situation_desc_ko="선택한 변환 문장입니다.",
            level=2,
            category="custom",
        )
    )

    assert created.text_en == "The timeline needs adjustment."
    assert created.situation_ko == "선택한 변환 문장입니다."
    assert created.level == 2


def test_today_expression_skips_practiced_expression(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    repository.create_user("today-user", "today@example.com", "Today", "hash")
    user = CurrentUser(id="today-user", email="today@example.com", nickname="Today")
    first = expressions.today_expression(current_user=user)

    repository.create_session(Session(expression_id=first.id, total_score=90), user_id=user.id)
    recommended = expressions.today_expression(current_user=user)

    assert recommended.id != first.id
