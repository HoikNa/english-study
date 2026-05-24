from app.schemas import CustomExpressionResult, FeedbackAlternative, FeedbackResult, SimulationReply


def create_feedback(target_sentence: str, recognized_text: str, pron_score: float, fluency_score: float, prosody_score: float) -> FeedbackResult:
    focus = "clarify" if "clarify" in target_sentence.lower() else target_sentence.split()[0]
    return FeedbackResult(
        issue=f"'{focus}' 발음과 문장 리듬을 조금 더 선명하게 만들면 비즈니스 미팅에서 신뢰감이 올라갑니다.",
        alternatives=[
            FeedbackAlternative(en="Let me walk you through the acceptance criteria.", ko="더 부드럽고 전문적인 도입", context="파트너 미팅"),
            FeedbackAlternative(en="Just to make sure we're aligned on the AC...", ko="중간 정리 때 자연스러운 표현", context="요구사항 협의"),
            FeedbackAlternative(en="Can we lock down the acceptance criteria here?", ko="결정이 필요한 순간", context="회의 마무리"),
        ],
        importance="핵심 용어를 정확히 말하면 IT 비즈니스 상황에서 설명의 신뢰도가 높아집니다.",
    )


def convert_custom_expression(text_ko: str, context: str | None) -> CustomExpressionResult:
    return CustomExpressionResult(
        text_en="I'd like to revisit the timeline because our current capacity is limited.",
        situation_desc_ko=context or "업무 일정과 리소스 제약을 정중하게 설명하는 상황입니다.",
        level=3,
        category="business",
    )


def create_simulation_reply(message: str) -> SimulationReply:
    return SimulationReply(
        reply="Interesting point. Could you walk me through how your platform handles data ingestion at scale?",
        coach_comment_ko="단순한 connect보다 integrates, handles, supports 같은 구체 동사를 쓰면 더 전문적으로 들립니다.",
    )

