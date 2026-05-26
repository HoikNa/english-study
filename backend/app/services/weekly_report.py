from __future__ import annotations

from collections import Counter
from datetime import date, datetime, time, timedelta, timezone

from app.schemas import WeeklyReport
from app.services import repository

_CATEGORY_LABELS = {
    "life": "생활 영어",
    "business": "비즈니스 영어",
    "it": "IT 기술 영어",
    "custom": "커스텀 표현",
}


def build_weekly_report(user_id: str, week: str | None = None) -> WeeklyReport:
    anchor = _parse_anchor_date(week)
    week_start = anchor - timedelta(days=anchor.weekday())
    current_start = datetime.combine(week_start, time.min, tzinfo=timezone.utc)
    current_end = current_start + timedelta(days=7)
    previous_start = current_start - timedelta(days=7)

    current_sessions = repository.list_sessions_between(current_start, current_end, user_id=user_id)
    previous_sessions = repository.list_sessions_between(previous_start, current_start, user_id=user_id)

    expressions = {expression.id: expression for expression in repository.list_expressions()}

    current_scores = [session.total_score for session in current_sessions if session.total_score is not None]
    previous_scores = [session.total_score for session in previous_sessions if session.total_score is not None]

    avg_score = round(sum(current_scores) / len(current_scores), 1) if current_scores else 0.0
    previous_avg = round(sum(previous_scores) / len(previous_scores), 1) if previous_scores else 0.0
    score_change = round(avg_score - previous_avg, 1)

    categories = Counter()
    for session in current_sessions:
        expression = expressions.get(session.expression_id)
        if expression:
            categories[expression.category] += 1

    top_category_key = categories.most_common(1)[0][0] if categories else "life"
    top_category = _CATEGORY_LABELS.get(top_category_key, "생활 영어")

    patterns = []
    ranked_sessions = sorted(
        current_sessions,
        key=lambda session: (
            session.total_score if session.total_score is not None else 0,
            session.created_at,
        ),
    )

    for index, session in enumerate(ranked_sessions[:3], start=1):
        expression = expressions.get(session.expression_id)
        if not expression:
            continue

        feedback_issue = None
        if isinstance(session.gpt_feedback_json, dict):
            issue = session.gpt_feedback_json.get("issue")
            if isinstance(issue, str) and issue.strip():
                feedback_issue = issue.strip()

        patterns.append(
            {
                "rank": f"{index:02d}",
                "bad": session.recognized_text or expression.text_en,
                "good": expression.text_en,
                "why": feedback_issue or _default_reason(session.total_score, expression.category),
                "category": _CATEGORY_LABELS.get(expression.category, expression.category),
            }
        )

    goals = _build_goals(avg_score, len(current_sessions), categories["custom"])

    return WeeklyReport(
        week_range=_format_week_range(week_start),
        total_sessions=len(current_sessions),
        expressions_practiced=len({session.expression_id for session in current_sessions}),
        avg_score=avg_score,
        score_change=score_change,
        top_category=top_category,
        patterns=patterns,
        goals=goals,
    )


def _parse_anchor_date(week: str | None) -> date:
    if not week:
        return datetime.now(timezone.utc).date()

    try:
        return date.fromisoformat(week)
    except ValueError:
        return datetime.fromisoformat(week).date()


def _format_week_range(start: date) -> str:
    end = start + timedelta(days=6)
    if start.month == end.month:
        return f"{start.month}월 {start.day}일 - {end.day}일"
    return f"{start.month}월 {start.day}일 - {end.month}월 {end.day}일"


def _default_reason(score: float | None, category: str) -> str:
    if score is None:
        return "이번 주에는 이 표현을 다시 정리해 두는 편이 좋습니다."
    if score < 60:
        return "핵심 단어를 천천히 끊어서 말하면 전달력이 올라갑니다."
    if score < 80:
        return "문장 리듬이 조금만 더 안정되면 훨씬 자연스럽게 들립니다."
    if category == "it":
        return "기술 용어 뒤의 연결어를 정리하면 발표 톤이 더 선명해집니다."
    return "발화 속도를 조금만 낮추면 신뢰감이 더 살아납니다."


def _build_goals(avg_score: float, sessions: int, custom_count: int) -> list[str]:
    goals = [
        "평균 점수 80pt 달성" if avg_score < 80 else "평균 점수 85pt 유지",
        "7일 연속 스트릭 유지" if sessions >= 7 else "매일 1세션 유지",
        f"커스텀 표현 {max(3, custom_count or 0)}개 추가",
    ]
    return goals
