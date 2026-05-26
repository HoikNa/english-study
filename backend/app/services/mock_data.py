from datetime import datetime, timezone

from app.schemas import CategoryProgress, Expression, ReviewQueue, SituationItem


EXPRESSIONS: list[Expression] = [
    Expression(
        id="exp-001",
        category="life",
        situation="Lease / Rent",
        situation_ko="집 계약 / 렌트",
        level=2,
        text_en="What utilities are included in the rent?",
        text_ko="임대료에 어떤 공과금이 포함되어 있나요?",
        chunks=["What utilities", "are included", "in the rent?"],
    ),
    Expression(
        id="exp-003",
        category="life",
        situation="Medical",
        situation_ko="병원 / 처방전",
        level=2,
        text_en="I've had a persistent cough for about a week.",
        text_ko="약 일주일째 기침이 계속되고 있어요.",
        chunks=["I've had", "a persistent cough", "for about a week."],
    ),
    Expression(
        id="exp-011",
        category="business",
        situation="Partnership Meeting",
        situation_ko="IT 파트너십 미팅 오프닝",
        level=3,
        text_en="I'd like to walk you through our IoT platform briefly.",
        text_ko="저희 IoT 플랫폼에 대해 간략히 설명드리겠습니다.",
        chunks=["I'd like to walk you through", "our IoT platform", "briefly."],
    ),
    Expression(
        id="exp-014",
        category="business",
        situation="Requirements",
        situation_ko="요구사항 정리",
        level=3,
        text_en="Let me clarify the acceptance criteria for this feature.",
        text_ko="이 기능의 인수 기준을 명확히 해 두겠습니다.",
        chunks=["Let me clarify", "the acceptance criteria", "for this feature."],
    ),
    Expression(
        id="exp-024",
        category="it",
        situation="API",
        situation_ko="API 연동 설명",
        level=2,
        text_en="Our API returns a standardized error code for each failure case.",
        text_ko="저희 API는 각 실패 케이스에 표준화된 오류 코드를 반환합니다.",
        chunks=["Our API returns", "a standardized error code", "for each failure case."],
    ),
]

SITUATIONS: list[SituationItem] = [
    SituationItem(id="sit-01", idx="01", name="집 계약 / 렌트", name_en="Lease", total_expressions=8, completed_expressions=3, best_score=78),
    SituationItem(id="sit-02", idx="02", name="병원 / 처방전", name_en="Medical", total_expressions=10, completed_expressions=10, best_score=85),
    SituationItem(id="sit-08", idx="08", name="IT 미팅 오프닝", name_en="Meeting", total_expressions=10, completed_expressions=5, best_score=82),
    SituationItem(id="sit-09", idx="09", name="요구사항 정리", name_en="Requirements", total_expressions=8, completed_expressions=4, best_score=78),
    SituationItem(id="sit-10", idx="10", name="기술 설명", name_en="Tech", total_expressions=10, completed_expressions=3, best_score=73),
]

REVIEW_QUEUE: dict[str, ReviewQueue] = {
    "exp-014": ReviewQueue(
        expression_id="exp-014",
        expression=EXPRESSIONS[3],
        interval=1,
        repetition=1,
        ef=2.1,
        next_review_at=datetime.now(timezone.utc).isoformat(),
        last_score=58,
        total_attempts=2,
    )
}

CATEGORY_PROGRESS: list[CategoryProgress] = [
    CategoryProgress(category="life", name="생활 영어", total=10, completed=5, situations=SITUATIONS[:2]),
    CategoryProgress(category="business", name="비즈니스 영어", total=10, completed=4, situations=SITUATIONS[2:4]),
    CategoryProgress(category="it", name="IT 기술 영어", total=10, completed=3, situations=SITUATIONS[4:]),
]

STREAK = {"days": 15, "weekFlags": [True, True, True, True, True, False, False]}


def due_review_items() -> list[ReviewQueue]:
    now = datetime.now(timezone.utc)
    return [
        item for item in REVIEW_QUEUE.values()
        if datetime.fromisoformat(item.next_review_at) <= now
    ]
