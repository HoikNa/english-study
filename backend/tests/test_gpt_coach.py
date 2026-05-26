import json
from types import SimpleNamespace

from app.config import get_settings
from app.services import gpt_coach


class _FakeCompletions:
    def __init__(self):
        self.calls = []

    def create(self, **kwargs):
        self.calls.append(kwargs)
        content = json.dumps(
            {
                "issue": "clarify 발음을 더 선명하게 말하면 좋습니다.",
                "alternatives": [
                    {"en": "Could you clarify the acceptance criteria?", "ko": "정확한 확인", "context": "요구사항 회의"},
                    {"en": "Can we align on the acceptance criteria?", "ko": "합의 강조", "context": "파트너 미팅"},
                    {"en": "Let's confirm the acceptance criteria.", "ko": "결정 정리", "context": "회의 마무리"},
                ],
                "importance": "요구사항 합의 표현은 IT 미팅에서 중요합니다.",
            }
        )
        return SimpleNamespace(choices=[SimpleNamespace(message=SimpleNamespace(content=content))])


def test_feedback_uses_dedicated_low_latency_model(monkeypatch):
    monkeypatch.setenv("OPENAI_API_KEY", "test-key")
    monkeypatch.setenv("OPENAI_GPT_MODEL", "gpt-4o")
    monkeypatch.setenv("OPENAI_FEEDBACK_MODEL", "gpt-4.1-nano")
    get_settings.cache_clear()

    completions = _FakeCompletions()
    fake_client = SimpleNamespace(chat=SimpleNamespace(completions=completions))
    monkeypatch.setattr(gpt_coach, "_openai_client", lambda: fake_client)

    result = gpt_coach.create_feedback(
        target_sentence="Could you clarify the acceptance criteria?",
        recognized_text="Could you clarify the acceptance criteria?",
        pron_score=82,
        fluency_score=71,
        prosody_score=68,
    )

    assert completions.calls[0]["model"] == "gpt-4.1-nano"
    assert completions.calls[0]["temperature"] == 0.2
    assert completions.calls[0]["max_tokens"] == 220
    assert len(result.alternatives) == 3
