from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query

from app.dependencies.auth import CurrentUser, get_current_user
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


@router.get("/today", response_model=Expression)
def today_expression(current_user: CurrentUser = Depends(get_current_user)) -> Expression:
    return repository.recommended_expression(current_user.id)


@router.get("/{expression_id}", response_model=Expression)
def get_expression(expression_id: str) -> Expression:
    return repository.get_expression(expression_id)


@router.get("/{expression_id}/tts")
def get_expression_tts(expression_id: str, speed: float = 1.0) -> dict[str, str]:
    expression = repository.get_expression(expression_id)
    return {"audio_url": get_tts_url(expression.text_en, speed)}


_MAX_CUSTOM_TEXT_LEN = 500


@router.post("/custom", status_code=201, response_model=Expression)
def create_custom_expression(
    payload: CustomExpressionRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> Expression:
    if payload.text_en and payload.situation_desc_ko:
        if len(payload.text_en) > _MAX_CUSTOM_TEXT_LEN or len(payload.situation_desc_ko) > _MAX_CUSTOM_TEXT_LEN:
            raise HTTPException(status_code=400, detail="Custom expression text too long")
        text_en = payload.text_en
        situation_ko = payload.situation_desc_ko
        level = payload.level or 3
    else:
        converted = gpt_coach.convert_custom_expression(payload.text_ko, payload.context)
        text_en = converted.text_en
        situation_ko = converted.situation_desc_ko
        level = converted.level

    expression = Expression(
        id=f"custom-{uuid4()}",
        category="custom",
        situation="Custom",
        situation_ko=situation_ko,
        level=level,
        text_en=text_en,
        text_ko=payload.text_ko,
        chunks=text_en.split(" — "),
        is_custom=True,
    )
    return repository.add_expression(expression, owner_user_id=current_user.id)


@router.delete("/{expression_id}/custom", status_code=204)
def delete_custom_expression(
    expression_id: str,
    current_user: CurrentUser = Depends(get_current_user),
) -> None:
    repository.delete_custom_expression(expression_id, user_id=current_user.id)
    return None
