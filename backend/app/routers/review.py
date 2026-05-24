from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException

from app.dependencies.auth import CurrentUser, get_current_user
from app.schemas import ReviewQueue, ReviewToday, ReviewUpdateRequest
from app.services import repository
from app.services.sm2_scheduler import calculate_sm2

router = APIRouter(prefix="/review", tags=["review"])


@router.get("/today", response_model=ReviewToday)
def today(current_user: CurrentUser = Depends(get_current_user)) -> ReviewToday:
    items = repository.due_review_items(current_user.id)
    return ReviewToday(items=items, count=len(items))


@router.post("/{expression_id}/enqueue", status_code=201, response_model=ReviewQueue)
def enqueue(expression_id: str, current_user: CurrentUser = Depends(get_current_user)) -> ReviewQueue:
    existing = repository.get_review_queue(expression_id, current_user.id)
    if existing:
        raise HTTPException(status_code=409, detail="Review queue already exists")

    expression = repository.get_expression(expression_id)
    next_review = calculate_sm2(score=55, repetition=0, interval=1, ef=2.5, now=datetime.now(timezone.utc))
    return repository.upsert_review_queue(
        ReviewQueue(
            expression_id=expression_id,
            expression=expression,
            interval=next_review.interval,
            repetition=next_review.repetition,
            ef=next_review.ef,
            next_review_at=next_review.next_review_at,
            last_score=55,
            total_attempts=1,
        ),
        user_id=current_user.id,
    )


@router.patch("/{expression_id}/update", response_model=ReviewQueue)
def update_review(
    expression_id: str,
    payload: ReviewUpdateRequest,
    current_user: CurrentUser = Depends(get_current_user),
) -> ReviewQueue:
    queue = repository.get_review_queue(expression_id, current_user.id)
    if not queue:
        expression = repository.get_expression(expression_id)
        queue = ReviewQueue(
            expression_id=expression_id,
            expression=expression,
            next_review_at=payload.next_review_at,
        )

    queue.repetition = payload.repetition
    queue.interval = payload.interval_days
    queue.ef = payload.ease_factor
    queue.next_review_at = payload.next_review_at
    queue.last_score = payload.grade * 20
    queue.total_attempts += 1
    return repository.upsert_review_queue(queue, user_id=current_user.id)
