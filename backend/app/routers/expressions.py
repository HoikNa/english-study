from uuid import uuid4

from fastapi import APIRouter, Query

from app.schemas import CustomExpressionRequest, Expression, ExpressionPage
from app.services import gpt_coach, repository
from app.services.openai_tts import get_tts_url

router = APIRouter(prefix="/expressions", tags=["expressions"])


@router.get("", response_model=ExpressionPage)
def list_expressions(
    category: str | None = None,
    situation: str | None = None,
    level: int | None = None,
    skip: int = Query(default=0, ge=0),
    limit: int = Query(default=20, ge=1, le=100),
) -> ExpressionPage:
    items = repository.list_expressions(category=category, situation=situation, level=level)
    return ExpressionPage(items=items[skip: skip + limit], total=len(items))


@router.get("/{expression_id}", response_model=Expression)
def get_expression(expression_id: str) -> Expression:
    return repository.get_expression(expression_id)


@router.get("/{expression_id}/tts")
def get_expression_tts(expression_id: str, speed: float = 1.0) -> dict[str, str]:
    expression = repository.get_expression(expression_id)
    return {"audio_url": get_tts_url(expression.text_en, speed)}


@router.post("/custom", status_code=201, response_model=Expression)
def create_custom_expression(payload: CustomExpressionRequest) -> Expression:
    converted = gpt_coach.convert_custom_expression(payload.text_ko, payload.context)
    expression = Expression(
        id=f"custom-{uuid4()}",
        category=converted.category,
        situation="Custom",
        situation_ko=converted.situation_desc_ko,
        level=converted.level,
        text_en=converted.text_en,
        text_ko=payload.text_ko,
        chunks=converted.text_en.split(" — "),
        is_custom=True,
    )
    return repository.add_expression(expression)


@router.delete("/{expression_id}/custom", status_code=204)
def delete_custom_expression(expression_id: str) -> None:
    return None

