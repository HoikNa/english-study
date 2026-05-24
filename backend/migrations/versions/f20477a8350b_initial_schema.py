"""initial_schema

Revision ID: f20477a8350b
Revises:
Create Date: 2026-05-24 11:03:03.175978

"""
from typing import Sequence, Union

import sqlalchemy as sa
from alembic import op

revision: str = "f20477a8350b"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\"")

    op.create_table(
        "users",
        sa.Column("id", sa.UUID(), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("password_hash", sa.Text(), nullable=True),
        sa.Column("nickname", sa.String(100), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("goal", sa.String(20), nullable=True),
        sa.Column("daily_target_min", sa.Integer(), nullable=False, server_default="20"),
        sa.Column("streak_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("last_studied_at", sa.TIMESTAMP(timezone=True), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
    )

    op.create_table(
        "expressions",
        sa.Column("id", sa.UUID(), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("category", sa.String(20), nullable=False),
        sa.Column("situation", sa.String(50), nullable=False),
        sa.Column("situation_ko", sa.String(100), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.Column("text_en", sa.Text(), nullable=False),
        sa.Column("text_ko", sa.Text(), nullable=False),
        sa.Column("situation_desc_ko", sa.Text(), nullable=True),
        sa.Column("chunk_json", sa.Text(), nullable=False, server_default="'[]'"),
        sa.Column("audio_url", sa.String(500), nullable=True),
        sa.Column("audio_speed_urls", sa.Text(), nullable=True),
        sa.Column("is_custom", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
    )
    op.create_index("idx_expressions_category", "expressions", ["category"])
    op.create_index("idx_expressions_situation", "expressions", ["situation"])
    op.create_index("idx_expressions_level", "expressions", ["level"])

    op.create_table(
        "sessions",
        sa.Column("id", sa.UUID(), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("expression_id", sa.UUID(), sa.ForeignKey("expressions.id"), nullable=False),
        sa.Column("attempt_number", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("pron_score", sa.Float(), nullable=True),
        sa.Column("fluency_score", sa.Float(), nullable=True),
        sa.Column("prosody_score", sa.Float(), nullable=True),
        sa.Column("completeness_score", sa.Float(), nullable=True),
        sa.Column("total_score", sa.Float(), nullable=True),
        sa.Column("recognized_text", sa.Text(), nullable=True),
        sa.Column("word_errors_json", sa.Text(), nullable=True),
        sa.Column("gpt_feedback_json", sa.Text(), nullable=True),
        sa.Column("duration_sec", sa.Float(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("idx_sessions_user_id", "sessions", ["user_id"])
    op.create_index("idx_sessions_expression_created", "sessions", ["expression_id", "created_at"])

    op.create_table(
        "review_queue",
        sa.Column("id", sa.UUID(), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("expression_id", sa.UUID(), sa.ForeignKey("expressions.id", ondelete="CASCADE"), nullable=False),
        sa.Column("interval_days", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("repetition", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("ease_factor", sa.Float(), nullable=False, server_default="2.5"),
        sa.Column("next_review_at", sa.TIMESTAMP(timezone=True), nullable=False),
        sa.Column("last_score", sa.Float(), nullable=True),
        sa.Column("total_attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("is_deleted", sa.Boolean(), nullable=False, server_default="false"),
        sa.UniqueConstraint("user_id", "expression_id", name="uq_review_queue_user_expression"),
    )
    op.create_index("idx_review_queue_due", "review_queue", ["user_id", "next_review_at"])

    op.create_table(
        "simulations",
        sa.Column("id", sa.UUID(), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("scenario_code", sa.String(30), nullable=False),
        sa.Column("messages_json", sa.Text(), nullable=False, server_default="'[]'"),
        sa.Column("total_turns", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("broken_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("duration_sec", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
    )
    op.create_index("idx_simulations_user_id", "simulations", ["user_id"])

    op.create_table(
        "weekly_reports",
        sa.Column("id", sa.UUID(), server_default=sa.text("uuid_generate_v4()"), primary_key=True),
        sa.Column("user_id", sa.UUID(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("week_start", sa.Date(), nullable=False),
        sa.Column("total_sessions", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("avg_score", sa.Float(), nullable=True),
        sa.Column("improvement_pct", sa.Float(), nullable=True),
        sa.Column("top_errors_json", sa.Text(), nullable=True),
        sa.Column("gpt_analysis_ko", sa.Text(), nullable=True),
        sa.Column("categories_stats_json", sa.Text(), nullable=True),
        sa.Column("created_at", sa.TIMESTAMP(timezone=True), nullable=False, server_default=sa.text("NOW()")),
        sa.UniqueConstraint("user_id", "week_start", name="uq_weekly_reports_user_week"),
    )
    op.create_index("idx_weekly_reports_user_id", "weekly_reports", ["user_id"])


def downgrade() -> None:
    op.drop_table("weekly_reports")
    op.drop_table("simulations")
    op.drop_table("review_queue")
    op.drop_table("sessions")
    op.drop_table("expressions")
    op.drop_table("users")
