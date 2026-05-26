from app.routers import ai
from app.schemas import SimulationMessage, SimulationReply, SimulationStart
from app.services import gpt_coach


def test_simulation_start_returns_session_metadata():
    result = ai.simulate_start(SimulationStart(scenario_code="iot-meeting"))

    assert result.simulation_id
    assert result.first_message
    assert "introduce" in result.first_message.lower()


def test_simulation_message_uses_gpt_coach_reply(monkeypatch):
    captured = {}

    def fake_reply(message: str, history: list[dict] | None = None):
        captured["message"] = message
        captured["history"] = history
        return SimulationReply(reply="Sure, here is a direct answer.", coach_comment_ko="더 구체적으로 말하세요.")

    monkeypatch.setattr(gpt_coach, "create_simulation_reply", fake_reply)

    result = ai.simulate_message(
        simulation_id="sim-123",
        payload=SimulationMessage(
            message="We handle ingestion with an event pipeline.",
            history=[{"who": "me", "text": "We handle ingestion with an event pipeline.", "time": "12:00"}],
        ),
    )

    assert captured["message"] == "We handle ingestion with an event pipeline."
    assert captured["history"][0]["who"] == "me"
    assert result.reply == "Sure, here is a direct answer."
    assert result.coach_comment_ko == "더 구체적으로 말하세요."

