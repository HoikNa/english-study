from fastapi import APIRouter, Depends

from app.dependencies.auth import CurrentUser, get_current_user
from app.schemas import ProgressStats, WeeklyReport
from app.services import repository
from app.services.mock_data import CATEGORY_PROGRESS, STREAK

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/progress", response_model=ProgressStats)
def progress(current_user: CurrentUser = Depends(get_current_user)) -> ProgressStats:
    average_score = repository.average_session_score(current_user.id)
    return ProgressStats(
        pronScore=average_score if average_score is not None else 78,
        weeklyChange=12,
        totalExpressions=repository.count_expressions(),
        streak=STREAK,
        categories=CATEGORY_PROGRESS,
    )


@router.get("/weekly", response_model=WeeklyReport)
def weekly(week: str | None = None) -> WeeklyReport:
    return WeeklyReport(
        week_range="5월 16일 - 22일",
        total_sessions=12,
        expressions_practiced=34,
        avg_score=76,
        score_change=8,
        top_category="IT 미팅",
        patterns=[
            {
                "rank": "01",
                "bad": "I have built IoT platform for 5G",
                "good": "I've led IoT platform development for 5G",
                "why": "경험과 주도성을 함께 보여주는 표현입니다.",
                "category": "Leadership tone",
            }
        ],
        goals=["평균 점수 80pt 달성", "7일 연속 스트릭 유지", "커스텀 표현 3개 추가"],
    )
