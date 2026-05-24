from datetime import datetime, timezone
from typing import Literal
from uuid import uuid4

from pydantic import BaseModel, Field

Category = Literal["life", "business", "it", "custom"]
ErrorType = Literal["None", "Omission", "Insertion", "Mispronunciation"]


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Expression(BaseModel):
    id: str
    category: Category
    situation: str
    situation_ko: str
    level: int = Field(ge=1, le=4)
    text_en: str
    text_ko: str
    audio_url: str | None = None
    chunks: list[str]
    is_custom: bool = False


class User(BaseModel):
    id: str
    email: str
    nickname: str
    level: int = Field(default=3, ge=1, le=4)


class AuthRequest(BaseModel):
    email: str
    password: str = Field(min_length=6)
    nickname: str | None = None


class AuthResponse(BaseModel):
    user: User
    user_id: str
    access_token: str
    token_type: str = "bearer"


class ExpressionPage(BaseModel):
    items: list[Expression]
    total: int


class WordError(BaseModel):
    word: str
    accuracy_score: float = Field(ge=0, le=100)
    error_type: ErrorType = "None"


class PronunciationResult(BaseModel):
    pron_score: float = Field(ge=0, le=100)
    fluency_score: float = Field(ge=0, le=100)
    prosody_score: float = Field(ge=0, le=100)
    completeness_score: float = Field(ge=0, le=100)
    total_score: float = Field(ge=0, le=100)
    word_errors: list[WordError]
    recognized_text: str


class FeedbackAlternative(BaseModel):
    en: str
    ko: str
    context: str


class FeedbackResult(BaseModel):
    issue: str
    alternatives: list[FeedbackAlternative]
    importance: str


class CustomExpressionRequest(BaseModel):
    text_ko: str
    context: str | None = None


class CustomExpressionResult(BaseModel):
    text_en: str
    situation_desc_ko: str
    level: int = Field(ge=1, le=3)
    category: Category


class SessionCreate(BaseModel):
    expression_id: str
    pron_score: float | None = None
    fluency_score: float | None = None
    prosody_score: float | None = None
    completeness_score: float | None = None
    total_score: float | None = None
    recognized_text: str | None = None
    word_errors_json: list[dict] | None = None
    gpt_feedback_json: dict | None = None


class Session(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    expression_id: str
    attempt_number: int = 1
    pron_score: float | None = None
    fluency_score: float | None = None
    prosody_score: float | None = None
    completeness_score: float | None = None
    total_score: float | None = None
    recognized_text: str | None = None
    word_errors_json: list[dict] | None = None
    gpt_feedback_json: dict | None = None
    created_at: datetime = Field(default_factory=utc_now)


class SessionPage(BaseModel):
    items: list[Session]
    total: int


class ReviewQueue(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    expression_id: str
    expression: Expression
    interval: int = 1
    repetition: int = 0
    ef: float = 2.5
    next_review_at: str
    last_score: float | None = None
    total_attempts: int = 0


class ReviewToday(BaseModel):
    items: list[ReviewQueue]
    count: int


class ReviewUpdateRequest(BaseModel):
    grade: int = Field(ge=1, le=5)
    repetition: int = Field(ge=0)
    interval_days: int = Field(ge=1)
    ease_factor: float = Field(ge=1.3)
    next_review_at: str


class SituationItem(BaseModel):
    id: str
    idx: str
    name: str
    name_en: str
    total_expressions: int
    completed_expressions: int
    best_score: float | None = None


class CategoryProgress(BaseModel):
    category: Category
    name: str
    total: int
    completed: int
    situations: list[SituationItem]


class ProgressStats(BaseModel):
    pronScore: float
    weeklyChange: float
    totalExpressions: int
    streak: dict
    categories: list[CategoryProgress]


class WeeklyReport(BaseModel):
    week_range: str
    total_sessions: int
    expressions_practiced: int
    avg_score: float
    score_change: float
    top_category: str
    patterns: list[dict]
    goals: list[str]


class SimulationStart(BaseModel):
    scenario_code: str


class SimulationStartResult(BaseModel):
    simulation_id: str
    first_message: str


class SimulationMessage(BaseModel):
    message: str
    history: list[dict] = Field(default_factory=list)


class SimulationReply(BaseModel):
    reply: str
    coach_comment_ko: str | None = None
