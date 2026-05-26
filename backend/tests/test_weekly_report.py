from datetime import datetime, timezone

from app.config import get_settings
from app.database import reset_database_state_for_tests
from app.dependencies.auth import CurrentUser
from app.routers import reports
from app.schemas import Session
from app.services import repository
from app.services.weekly_report import build_weekly_report


def use_temp_database(monkeypatch, tmp_path):
    monkeypatch.setenv("DATABASE_URL", f"sqlite:///{tmp_path / 'weekly.sqlite3'}")
    get_settings.cache_clear()
    reset_database_state_for_tests()


def test_weekly_report_aggregates_sessions(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    repository.create_session(
        Session(
            expression_id="exp-011",
            pron_score=88,
            fluency_score=82,
            prosody_score=79,
            completeness_score=91,
            total_score=85,
            recognized_text="I'd like to walk you through our IoT platform briefly.",
            gpt_feedback_json={"issue": "기술 용어 뒤 연결어를 더 또렷하게 말하세요."},
            created_at=datetime(2026, 5, 20, 12, 0, tzinfo=timezone.utc),
        )
    )
    repository.create_session(
        Session(
            expression_id="exp-014",
            pron_score=72,
            fluency_score=68,
            prosody_score=70,
            completeness_score=75,
            total_score=71,
            recognized_text="Let me clarify the acceptance criteria for this feature.",
            created_at=datetime(2026, 5, 21, 12, 0, tzinfo=timezone.utc),
        )
    )
    repository.create_session(
        Session(
            expression_id="exp-011",
            total_score=62,
            created_at=datetime(2026, 5, 13, 12, 0, tzinfo=timezone.utc),
        )
    )

    report = build_weekly_report("dev-user", week="2026-05-20")

    assert report.week_range == "5월 18일 - 24일"
    assert report.total_sessions == 2
    assert report.expressions_practiced == 2
    assert report.avg_score == 78.0
    assert report.score_change == 16.0
    assert report.top_category == "비즈니스 영어"
    assert len(report.patterns) == 2
    assert report.patterns[0]["rank"] == "01"
    assert report.patterns[0]["good"] == "Let me clarify the acceptance criteria for this feature."
    assert report.goals[0] in {"평균 점수 80pt 달성", "평균 점수 85pt 유지"}


def test_weekly_route_requires_auth(monkeypatch, tmp_path):
    use_temp_database(monkeypatch, tmp_path)

    current_user = CurrentUser(id="dev-user", email="dev@speakready.local", nickname="Hoik")
    report = reports.weekly(week="2026-05-20", current_user=current_user)

    assert report.total_sessions == 0
