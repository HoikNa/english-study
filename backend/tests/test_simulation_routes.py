from app.routers import ai
from app.schemas import SimulationMessage, SimulationReply, SimulationStart
from app.services import gpt_coach


def test_simulation_start_returns_scenario_first_message():
    iot = ai.simulate_start(SimulationStart(scenario_code="iot-meeting"))
    req = ai.simulate_start(SimulationStart(scenario_code="requirements"))

    assert iot.simulation_id and req.simulation_id
    assert "architecture" in iot.first_message.lower()
    assert "acceptance criteria" in req.first_message.lower()
    assert iot.first_message != req.first_message


def test_simulation_start_falls_back_for_unknown_scenario():
    result = ai.simulate_start(SimulationStart(scenario_code="unknown-code"))
    expected = ai.simulate_start(SimulationStart(scenario_code="iot-meeting"))
    assert result.first_message == expected.first_message


def test_simulation_message_uses_gpt_coach_reply(monkeypatch):
    captured = {}

    def fake_reply(message: str, history: list[dict] | None = None, scenario_code: str | None = None):
        captured["message"] = message
        captured["history"] = history
        captured["scenario_code"] = scenario_code
        return SimulationReply(reply="Sure, here is a direct answer.", coach_comment_ko="더 구체적으로 말하세요.")

    monkeypatch.setattr(gpt_coach, "create_simulation_reply", fake_reply)

    result = ai.simulate_message(
        simulation_id="sim-123",
        payload=SimulationMessage(
            message="We handle ingestion with an event pipeline.",
            history=[{"who": "me", "text": "We handle ingestion with an event pipeline.", "time": "12:00"}],
            scenario_code="requirements",
        ),
    )

    assert captured["message"] == "We handle ingestion with an event pipeline."
    assert captured["history"][0]["who"] == "me"
    assert captured["scenario_code"] == "requirements"
    assert result.reply == "Sure, here is a direct answer."
    assert result.coach_comment_ko == "더 구체적으로 말하세요."

