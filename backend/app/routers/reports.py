from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends

from app.dependencies.auth import CurrentUser, get_current_user
from app.schemas import ProgressStats, WeeklyReport
from app.services import repository
from app.services.weekly_report import build_weekly_report

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/progress", response_model=ProgressStats)
def progress(current_user: CurrentUser = Depends(get_current_user)) -> ProgressStats:
    average_score = repository.average_session_score(current_user.id)
    now = datetime.now(timezone.utc)
    current_week_start = now - timedelta(days=7)
    previous_week_start = now - timedelta(days=14)
    current_week_average = repository.average_session_score_between(current_week_start, now, current_user.id)
    previous_week_average = repository.average_session_score_between(previous_week_start, current_week_start, current_user.id)
    weekly_change = 0.0
    if current_week_average is not None and previous_week_average is not None:
        weekly_change = round(current_week_average - previous_week_average, 1)

    return ProgressStats(
        pronScore=average_score if average_score is not None else 0,
        weeklyChange=weekly_change,
        totalExpressions=repository.count_practiced_expressions(current_user.id),
        streak=repository.learning_streak(current_user.id),
        categories=repository.category_progress(current_user.id),
    )


@router.get("/weekly", response_model=WeeklyReport)
def weekly(week: str | None = None, current_user: CurrentUser = Depends(get_current_user)) -> WeeklyReport:
    return build_weekly_report(current_user.id, week=week)
