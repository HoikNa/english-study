from uuid import uuid4

from fastapi import APIRouter, Depends, File, Form, UploadFile
from pydantic import BaseModel

from app.schemas import (
    CustomExpressionRequest,
    CustomExpressionResult,
    FeedbackResult,
    PronunciationResult,
    SimulationMessage,
    SimulationReply,
    SimulationStart,
    SimulationStartResult,
)
from app.services import azure_speech, gpt_coach
from app.services.openai_tts import get_tts_url
from app.services.rate_limit import ai_rate_limit

router = APIRouter(prefix="/ai", tags=["ai"], dependencies=[Depends(ai_rate_limit)])


class FeedbackRequest(BaseModel):
    target_sentence: str
    recognized_text: str
    pron_score: float
    fluency_score: float
    prosody_score: float


class TtsRequest(BaseModel):
    text: str
    voice: str = "nova"
    speed: float = 1.0


@router.post("/pronunciation", response_model=PronunciationResult)
async def pronunciation(
    audio_file: UploadFile = File(...),
    reference_text: str = Form(...),
    expression_id: str | None = Form(default=None),
) -> PronunciationResult:
    audio_bytes = await audio_file.read()
    return azure_speech.assess_pronunciation(audio_bytes, reference_text)


@router.post("/feedback", response_model=FeedbackResult)
def feedback(payload: FeedbackRequest) -> FeedbackResult:
    return gpt_coach.create_feedback(
        target_sentence=payload.target_sentence,
        recognized_text=payload.recognized_text,
        pron_score=payload.pron_score,
        fluency_score=payload.fluency_score,
        prosody_score=payload.prosody_score,
    )


@router.post("/tts/generate")
def generate_tts(payload: TtsRequest) -> dict[str, str]:
    return {"audio_url": get_tts_url(payload.text, payload.speed, payload.voice)}


@router.post("/custom-expression", response_model=CustomExpressionResult)
def custom_expression(payload: CustomExpressionRequest) -> CustomExpressionResult:
    return gpt_coach.convert_custom_expression(payload.text_ko, payload.context)


@router.post("/simulate/start", response_model=SimulationStartResult)
def simulate_start(payload: SimulationStart) -> SimulationStartResult:
    return SimulationStartResult(
        simulation_id=str(uuid4()),
        first_message=gpt_coach.get_scenario_first_message(payload.scenario_code),
    )


@router.post("/simulate/{simulation_id}/message", response_model=SimulationReply)
def simulate_message(simulation_id: str, payload: SimulationMessage) -> SimulationReply:
    return gpt_coach.create_simulation_reply(
        payload.message,
        payload.history,
        scenario_code=payload.scenario_code,
    )
