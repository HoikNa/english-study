import json

from fastapi import HTTPException

from app.config import get_settings
from app.schemas import CustomExpressionResult, FeedbackAlternative, FeedbackResult, SimulationReply, ToneVariant

_USER_CONTEXT = (
    "사용자: 45세 한국인, 국내 통신사 IT서비스개발기획자, 토익 850, 회화 중하, "
    "브로큰 잉글리쉬 자주 사용, 미국 이민 후 IT 비즈니스 목표."
)

_FEEDBACK_SYSTEM = """
45세 한국인 IT서비스기획자에게 미국 비즈니스 영어 피드백을 한국어로 준다.
JSON만 출력:
{
  "issue": "가장 어색한 발음/표현 지적. 100자 이내",
  "alternatives": [
    {"en": "대안 표현 1", "ko": "이유 20자 이내", "context": "사용 상황"},
    {"en": "대안 표현 2", "ko": "이유 20자 이내", "context": "사용 상황"},
    {"en": "대안 표현 3", "ko": "이유 20자 이내", "context": "사용 상황"}
  ],
  "importance": "IT 비즈니스 중요도. 60자 이내"
}
""".strip()

_CUSTOM_SYSTEM = f"""
{_USER_CONTEXT}
한국어 문장을 IT 비즈니스 영어 표현으로 변환합니다.
서로 다른 3가지 톤(Direct / Diplomatic / Concise)으로 각각 표현을 만들어 주세요.
- Direct: 협상력 있고 단호한 톤
- Diplomatic: 관계를 유지하면서 우려를 전달하는 톤
- Concise: 핵심만 간결하게 전달하는 톤
반드시 아래 JSON 형식으로만 반환하세요. tones 배열은 정확히 3개, id는 direct/diplomatic/concise 순서:
{{
  "tones": [
    {{"id": "direct", "label": "Direct", "label_ko": "직접적", "text_en": "영어 표현 1", "note_ko": "이 톤의 특징 15자 이내"}},
    {{"id": "diplomatic", "label": "Diplomatic", "label_ko": "외교적", "text_en": "영어 표현 2", "note_ko": "이 톤의 특징 15자 이내"}},
    {{"id": "concise", "label": "Concise", "label_ko": "간결한", "text_en": "영어 표현 3", "note_ko": "이 톤의 특징 15자 이내"}}
  ],
  "situation_desc_ko": "사용 상황 설명 2문장 (한국어)",
  "level": 1~3 사이 정수,
  "category": "life" | "business" | "it" | "custom"
}}
""".strip()

_SIMULATION_SCENARIOS: dict[str, dict[str, str]] = {
    "iot-meeting": {
        "persona": "미국인 CTO Marcus",
        "context_ko": "IoT 플랫폼 통합 첫 미팅. 사용자 회사의 기술 역량, 레이턴시, 아키텍처 강점을 검증한다.",
        "first_message": "Thanks for joining. To get started, could you walk me through your IoT platform's architecture and where your latency advantage actually comes from?",
    },
    "requirements": {
        "persona": "미국인 PM Sarah",
        "context_ko": "요구사항 협의 미팅. 수락 조건을 명확히 하고 이해관계자 기대치를 조율한다.",
        "first_message": "Hi — appreciate you making time. Before we dive in, can you confirm which acceptance criteria are still open from your side?",
    },
}

_DEFAULT_SCENARIO_CODE = "iot-meeting"


def _scenario(scenario_code: str | None) -> dict[str, str]:
    return _SIMULATION_SCENARIOS.get(scenario_code or "", _SIMULATION_SCENARIOS[_DEFAULT_SCENARIO_CODE])


def get_scenario_first_message(scenario_code: str | None) -> str:
    return _scenario(scenario_code)["first_message"]


def _build_simulation_system(scenario_code: str | None) -> str:
    sc = _scenario(scenario_code)
    return f"""
{_USER_CONTEXT}
당신은 {sc['persona']}입니다. {sc['context_ko']}
규칙:
- 3문장 이내로 응답
- 브로큰 잉글리쉬나 어색한 표현 발견 시 [코치: 교정 코멘트] 형식으로 삽입
- 반드시 질문으로 마무리
반드시 아래 JSON 형식으로만 반환하세요:
{{
  "reply": "응답 (영어, 3문장 이내)",
  "coach_comment_ko": "교정 코멘트 (한국어, 없으면 null)"
}}
""".strip()


def _openai_client():
    settings = get_settings()
    if not settings.openai_api_key:
        return None
    from openai import OpenAI
    return OpenAI(api_key=settings.openai_api_key)


def _chat(system: str, user: str, temperature: float = 0.3, model: str | None = None, max_tokens: int = 300) -> str:
    client = _openai_client()
    if client is None:
        raise HTTPException(status_code=503, detail="OPENAI_API_KEY가 설정되지 않았습니다.")

    settings = get_settings()
    response = client.chat.completions.create(
        model=model or settings.openai_gpt_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        max_tokens=max_tokens,
        temperature=temperature,
        response_format={"type": "json_object"},
    )
    return response.choices[0].message.content or ""


def create_feedback(
    target_sentence: str,
    recognized_text: str,
    pron_score: float,
    fluency_score: float,
    prosody_score: float,
) -> FeedbackResult:
    settings = get_settings()
    if not settings.openai_api_key:
        return _mock_feedback(target_sentence)

    user_msg = (
        f"target={target_sentence}\n"
        f"said={recognized_text}\n"
        f"scores=pron{pron_score:.0f},fluency{fluency_score:.0f},prosody{prosody_score:.0f}"
    )

    try:
        raw = _chat(
            _FEEDBACK_SYSTEM,
            user_msg,
            temperature=0.2,
            model=settings.openai_feedback_model,
            max_tokens=220,
        )
        data = json.loads(raw)
        return FeedbackResult(
            issue=data["issue"],
            alternatives=[FeedbackAlternative(**a) for a in data["alternatives"]],
            importance=data["importance"],
        )
    except (json.JSONDecodeError, KeyError) as e:
        raise HTTPException(status_code=502, detail=f"GPT 응답 파싱 실패: {e}")


def convert_custom_expression(text_ko: str, context: str | None) -> CustomExpressionResult:
    settings = get_settings()
    if not settings.openai_api_key:
        return _mock_custom(text_ko)

    user_msg = f"한국어 문장: {text_ko}"
    if context:
        user_msg += f"\n상황 힌트: {context}"

    try:
        raw = _chat(_CUSTOM_SYSTEM, user_msg, temperature=0.3, max_tokens=600)
        data = json.loads(raw)
        return CustomExpressionResult(
            tones=[ToneVariant(**tone) for tone in data["tones"]],
            situation_desc_ko=data["situation_desc_ko"],
            level=int(data["level"]),
            category=data["category"],
        )
    except (json.JSONDecodeError, KeyError) as e:
        raise HTTPException(status_code=502, detail=f"GPT 응답 파싱 실패: {e}")


def create_simulation_reply(
    message: str,
    history: list[dict] | None = None,
    scenario_code: str | None = None,
) -> SimulationReply:
    settings = get_settings()
    if not settings.openai_api_key:
        return _mock_simulation()

    history_str = json.dumps(history or [], ensure_ascii=False)
    user_msg = f"대화 이력: {history_str}\n사용자 발화: {message}"

    try:
        raw = _chat(_build_simulation_system(scenario_code), user_msg, temperature=0.8)
        data = json.loads(raw)
        return SimulationReply(
            reply=data["reply"],
            coach_comment_ko=data.get("coach_comment_ko"),
        )
    except (json.JSONDecodeError, KeyError) as e:
        raise HTTPException(status_code=502, detail=f"GPT 응답 파싱 실패: {e}")


# --- Mock fallbacks (API 키 미설정 시) ---

def _mock_feedback(target_sentence: str) -> FeedbackResult:
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


def _mock_custom(text_ko: str) -> CustomExpressionResult:
    return CustomExpressionResult(
        tones=[
            ToneVariant(
                id="direct",
                label="Direct",
                label_ko="직접적",
                text_en="I need to push back on this timeline — it's not realistic given our current capacity.",
                note_ko="협상력 있고 단호한 톤",
            ),
            ToneVariant(
                id="diplomatic",
                label="Diplomatic",
                label_ko="외교적",
                text_en="I'd like to revisit the timeline — I have some concerns about our capacity to deliver by then.",
                note_ko="관계를 유지하면서 우려를 전달",
            ),
            ToneVariant(
                id="concise",
                label="Concise",
                label_ko="간결한",
                text_en="The timeline needs adjustment — we're at capacity.",
                note_ko="바쁜 미팅에서 빠르게 핵심 전달",
            ),
        ],
        situation_desc_ko="업무 일정과 리소스 제약을 설명하는 상황입니다. 미팅에서 일정 조율이 필요할 때 사용합니다.",
        level=3,
        category="business",
    )


def _mock_simulation() -> SimulationReply:
    return SimulationReply(
        reply="Interesting point. Could you walk me through how your platform handles data ingestion at scale?",
        coach_comment_ko="단순한 connect보다 integrates, handles, supports 같은 구체 동사를 쓰면 더 전문적으로 들립니다.",
    )
