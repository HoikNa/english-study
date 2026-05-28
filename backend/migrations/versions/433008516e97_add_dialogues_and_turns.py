"""add_dialogues_and_turns

Revision ID: 433008516e97
Revises: f20477a8350b
Create Date: 2026-05-28 13:58:34.416883

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '433008516e97'
down_revision: Union[str, Sequence[str], None] = 'f20477a8350b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.create_table(
        "dialogues",
        sa.Column("id", sa.String(60), primary_key=True),
        sa.Column("situation_ko", sa.String(200), nullable=False),
        sa.Column("situation_en", sa.String(200), nullable=True),
        sa.Column("category", sa.String(20), nullable=False),
        sa.Column("level", sa.Integer(), nullable=False),
        sa.Column("speaker_a_voice", sa.String(20), nullable=False, server_default="echo"),
        sa.Column("speaker_b_voice", sa.String(20), nullable=False, server_default="fable"),
        sa.Column("speaker_a_name", sa.String(60), nullable=True),
        sa.Column("speaker_b_name", sa.String(60), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
    )
    op.create_index("idx_dialogues_category", "dialogues", ["category"])

    op.create_table(
        "dialogue_turns",
        sa.Column("id", sa.String(60), primary_key=True),
        sa.Column(
            "dialogue_id",
            sa.String(60),
            sa.ForeignKey("dialogues.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("turn_index", sa.Integer(), nullable=False),
        sa.Column("speaker", sa.String(2), nullable=False),
        sa.Column("text_en", sa.Text(), nullable=False),
        sa.Column("text_ko", sa.Text(), nullable=True),
        sa.Column("expression_id", sa.String(60), nullable=True),
        sa.Column(
            "created_at",
            sa.TIMESTAMP(timezone=True),
            nullable=False,
            server_default=sa.text("NOW()"),
        ),
        sa.UniqueConstraint("dialogue_id", "turn_index", name="uq_dialogue_turns_dialogue_index"),
    )
    op.create_index("idx_dialogue_turns_dialogue", "dialogue_turns", ["dialogue_id", "turn_index"])


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_table("dialogue_turns")
    op.drop_table("dialogues")
