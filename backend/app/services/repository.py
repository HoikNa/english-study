from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from app.database import connect, ensure_database
from app.schemas import Expression, ReviewQueue, Session, User

DEFAULT_USER_ID = "dev-user"


def _decode_json(value: str | None, fallback):
    if not value:
        return fallback
    return json.loads(value)


def _expression_from_row(row) -> Expression:
    return Expression(
        id=row["id"],
        category=row["category"],
        situation=row["situation"],
        situation_ko=row["situation_ko"],
        level=row["level"],
        text_en=row["text_en"],
        text_ko=row["text_ko"],
        audio_url=row["audio_url"],
        chunks=_decode_json(row["chunks_json"], []),
        is_custom=bool(row["is_custom"]),
    )


def _session_from_row(row) -> Session:
    return Session(
        id=row["id"],
        expression_id=row["expression_id"],
        attempt_number=row["attempt_number"],
        pron_score=row["pron_score"],
        fluency_score=row["fluency_score"],
        prosody_score=row["prosody_score"],
        completeness_score=row["completeness_score"],
        total_score=row["total_score"],
        recognized_text=row["recognized_text"],
        word_errors_json=_decode_json(row["word_errors_json"], None),
        gpt_feedback_json=_decode_json(row["gpt_feedback_json"], None),
        created_at=datetime.fromisoformat(row["created_at"]),
    )


def _review_from_row(row) -> ReviewQueue:
    expression = _expression_from_row(row)
    return ReviewQueue(
        id=row["review_id"],
        expression_id=row["expression_id"],
        expression=expression,
        interval=row["interval"],
        repetition=row["repetition"],
        ef=row["ef"],
        next_review_at=row["next_review_at"],
        last_score=row["last_score"],
        total_attempts=row["total_attempts"],
    )


def _user_from_row(row) -> User:
    return User(
        id=row["id"],
        email=row["email"],
        nickname=row["nickname"],
        level=3,
    )


def create_user(user_id: str, email: str, nickname: str, password_hash: str) -> User:
    ensure_database()
    normalized_email = email.strip().lower()
    with connect() as conn:
        try:
            conn.execute(
                """
                INSERT INTO users (id, email, nickname, password_hash, updated_at)
                VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
                """,
                (user_id, normalized_email, nickname.strip() or normalized_email.split("@")[0], password_hash),
            )
            conn.commit()
        except Exception as exc:
            raise HTTPException(status_code=409, detail="Email already registered") from exc

        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return _user_from_row(row)


def get_user_by_email(email: str):
    ensure_database()
    with connect() as conn:
        return conn.execute("SELECT * FROM users WHERE email = ?", (email.strip().lower(),)).fetchone()


def get_user_by_id(user_id: str) -> User | None:
    ensure_database()
    with connect() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return _user_from_row(row) if row else None


def list_expressions(category: str | None = None, situation: str | None = None, level: int | None = None) -> list[Expression]:
    ensure_database()
    where: list[str] = []
    params: list[str | int] = []

    if category:
        where.append("category = ?")
        params.append(category)
    if situation:
        where.append("(situation = ? OR situation_ko = ?)")
        params.extend([situation, situation])
    if level:
        where.append("level = ?")
        params.append(level)

    query = "SELECT * FROM expressions"
    if where:
        query += " WHERE " + " AND ".join(where)
    query += " ORDER BY is_custom ASC, id ASC"

    with connect() as conn:
        rows = conn.execute(query, params).fetchall()
    return [_expression_from_row(row) for row in rows]


def get_expression(expression_id: str) -> Expression:
    ensure_database()
    with connect() as conn:
        row = conn.execute("SELECT * FROM expressions WHERE id = ?", (expression_id,)).fetchone()

    if not row:
        raise HTTPException(status_code=404, detail="Expression not found")
    return _expression_from_row(row)


def add_expression(expression: Expression) -> Expression:
    ensure_database()
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO expressions (
                id, category, situation, situation_ko, level, text_en, text_ko,
                audio_url, chunks_json, is_custom
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                expression.id,
                expression.category,
                expression.situation,
                expression.situation_ko,
                expression.level,
                expression.text_en,
                expression.text_ko,
                expression.audio_url,
                json.dumps(expression.chunks, ensure_ascii=False),
                int(expression.is_custom),
            ),
        )
        conn.commit()
    return expression


def create_session(session: Session, user_id: str = DEFAULT_USER_ID) -> Session:
    ensure_database()
    get_expression(session.expression_id)

    with connect() as conn:
        row = conn.execute(
            "SELECT COUNT(*) AS count FROM sessions WHERE user_id = ? AND expression_id = ?",
            (user_id, session.expression_id),
        ).fetchone()
        session.attempt_number = int(row["count"]) + 1

        conn.execute(
            """
            INSERT INTO sessions (
                id, user_id, expression_id, attempt_number, pron_score,
                fluency_score, prosody_score, completeness_score, total_score,
                recognized_text, word_errors_json, gpt_feedback_json, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                session.id,
                user_id,
                session.expression_id,
                session.attempt_number,
                session.pron_score,
                session.fluency_score,
                session.prosody_score,
                session.completeness_score,
                session.total_score,
                session.recognized_text,
                json.dumps(session.word_errors_json, ensure_ascii=False) if session.word_errors_json is not None else None,
                json.dumps(session.gpt_feedback_json, ensure_ascii=False) if session.gpt_feedback_json is not None else None,
                session.created_at.isoformat(),
            ),
        )
        conn.commit()

    return session


def list_sessions(expression_id: str | None = None, user_id: str = DEFAULT_USER_ID) -> list[Session]:
    ensure_database()
    params: list[str] = [user_id]
    query = "SELECT * FROM sessions WHERE user_id = ?"
    if expression_id:
        query += " AND expression_id = ?"
        params.append(expression_id)
    query += " ORDER BY created_at DESC"

    with connect() as conn:
        rows = conn.execute(query, params).fetchall()
    return [_session_from_row(row) for row in rows]


def get_review_queue(expression_id: str, user_id: str = DEFAULT_USER_ID) -> ReviewQueue | None:
    ensure_database()
    with connect() as conn:
        row = conn.execute(
            """
            SELECT
                rq.id AS review_id,
                rq.expression_id,
                rq.interval,
                rq.repetition,
                rq.ef,
                rq.next_review_at,
                rq.last_score,
                rq.total_attempts,
                e.*
            FROM review_queue rq
            JOIN expressions e ON e.id = rq.expression_id
            WHERE rq.user_id = ? AND rq.expression_id = ?
            """,
            (user_id, expression_id),
        ).fetchone()
    return _review_from_row(row) if row else None


def due_review_items(user_id: str = DEFAULT_USER_ID) -> list[ReviewQueue]:
    ensure_database()
    due_before = (datetime.now(timezone.utc) + timedelta(days=1)).isoformat()
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT
                rq.id AS review_id,
                rq.expression_id,
                rq.interval,
                rq.repetition,
                rq.ef,
                rq.next_review_at,
                rq.last_score,
                rq.total_attempts,
                e.*
            FROM review_queue rq
            JOIN expressions e ON e.id = rq.expression_id
            WHERE rq.user_id = ? AND rq.next_review_at <= ?
            ORDER BY rq.next_review_at ASC
            """,
            (user_id, due_before),
        ).fetchall()
    return [_review_from_row(row) for row in rows]


def upsert_review_queue(queue: ReviewQueue, user_id: str = DEFAULT_USER_ID) -> ReviewQueue:
    ensure_database()
    get_expression(queue.expression_id)

    with connect() as conn:
        conn.execute(
            """
            INSERT INTO review_queue (
                id, user_id, expression_id, interval, repetition, ef,
                next_review_at, last_score, total_attempts, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id, expression_id) DO UPDATE SET
                interval = excluded.interval,
                repetition = excluded.repetition,
                ef = excluded.ef,
                next_review_at = excluded.next_review_at,
                last_score = excluded.last_score,
                total_attempts = excluded.total_attempts,
                updated_at = CURRENT_TIMESTAMP
            """,
            (
                queue.id,
                user_id,
                queue.expression_id,
                queue.interval,
                queue.repetition,
                queue.ef,
                queue.next_review_at,
                queue.last_score,
                queue.total_attempts,
            ),
        )
        conn.commit()

    refreshed = get_review_queue(queue.expression_id, user_id)
    if not refreshed:
        raise HTTPException(status_code=500, detail="Review queue upsert failed")
    return refreshed


def count_expressions() -> int:
    ensure_database()
    with connect() as conn:
        row = conn.execute("SELECT COUNT(*) AS count FROM expressions").fetchone()
    return int(row["count"])


def average_session_score(user_id: str = DEFAULT_USER_ID) -> float | None:
    ensure_database()
    with connect() as conn:
        row = conn.execute(
            "SELECT AVG(total_score) AS average_score FROM sessions WHERE user_id = ? AND total_score IS NOT NULL",
            (user_id,),
        ).fetchone()
    return round(float(row["average_score"]), 1) if row["average_score"] is not None else None
