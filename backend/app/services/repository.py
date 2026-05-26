from __future__ import annotations

import json
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException

from app.database import connect, database_backend, ensure_database
from app.schemas import CategoryProgress, Expression, ReviewQueue, Session, SituationItem, User

DEFAULT_USER_ID = "dev-user"
CATEGORY_NAMES = {
    "life": "생활 영어",
    "business": "비즈니스 영어",
    "it": "IT 영어",
    "custom": "내 표현",
}


def _not_deleted_clause() -> str:
    return "is_deleted = FALSE" if database_backend() == "postgresql" else "is_deleted = 0"


def _deleted_value(is_deleted: bool) -> bool | int:
    return is_deleted if database_backend() == "postgresql" else int(is_deleted)


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


def store_refresh_token(token_id: str, user_id: str, token_hash: str, expires_at: str) -> None:
    ensure_database()
    with connect() as conn:
        conn.execute(
            """
            INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at)
            VALUES (?, ?, ?, ?)
            """,
            (token_id, user_id, token_hash, expires_at),
        )
        conn.commit()


def get_refresh_token(token_id: str):
    ensure_database()
    with connect() as conn:
        return conn.execute("SELECT * FROM refresh_tokens WHERE id = ?", (token_id,)).fetchone()


def is_refresh_token_active(token_id: str, token_hash: str) -> bool:
    row = get_refresh_token(token_id)
    if not row:
        return False
    if row["token_hash"] != token_hash or row["revoked_at"] is not None:
        return False
    return datetime.fromisoformat(row["expires_at"]) > datetime.now(timezone.utc)


def revoke_refresh_token(token_id: str, replaced_by_token_id: str | None = None) -> None:
    ensure_database()
    with connect() as conn:
        conn.execute(
            """
            UPDATE refresh_tokens
            SET revoked_at = COALESCE(revoked_at, ?),
                replaced_by_token_id = COALESCE(replaced_by_token_id, ?)
            WHERE id = ?
            """,
            (datetime.now(timezone.utc).isoformat(), replaced_by_token_id, token_id),
        )
        conn.commit()


def revoke_user_refresh_tokens(user_id: str) -> None:
    ensure_database()
    with connect() as conn:
        conn.execute(
            """
            UPDATE refresh_tokens
            SET revoked_at = COALESCE(revoked_at, ?)
            WHERE user_id = ?
            """,
            (datetime.now(timezone.utc).isoformat(), user_id),
        )
        conn.commit()


def delete_user_account(user_id: str) -> bool:
    ensure_database()
    with connect() as conn:
        row = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
        if not row:
            return False

        conn.execute("DELETE FROM refresh_tokens WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM review_queue WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM sessions WHERE user_id = ?", (user_id,))
        conn.execute("DELETE FROM users WHERE id = ?", (user_id,))
        conn.commit()
    return True


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

    query = f"SELECT * FROM expressions WHERE {_not_deleted_clause()}"
    if where:
        query += " AND " + " AND ".join(where)
    query += " ORDER BY is_custom ASC, id ASC"

    with connect() as conn:
        rows = conn.execute(query, params).fetchall()
    return [_expression_from_row(row) for row in rows]


def get_expression(expression_id: str) -> Expression:
    ensure_database()
    with connect() as conn:
        row = conn.execute(
            f"SELECT * FROM expressions WHERE id = ? AND {_not_deleted_clause()}",
            (expression_id,),
        ).fetchone()

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


def delete_custom_expression(expression_id: str) -> None:
    ensure_database()
    with connect() as conn:
        row = conn.execute(
            f"SELECT id, is_custom FROM expressions WHERE id = ? AND {_not_deleted_clause()}",
            (expression_id,),
        ).fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Expression not found")
        if not bool(row["is_custom"]):
            raise HTTPException(status_code=403, detail="Only custom expressions can be deleted")

        conn.execute(
            """
            UPDATE expressions
            SET is_deleted = ?
            WHERE id = ?
            """,
            (_deleted_value(True), expression_id),
        )
        conn.commit()


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


def list_sessions_between(
    start_at: datetime,
    end_at: datetime,
    user_id: str = DEFAULT_USER_ID,
) -> list[Session]:
    ensure_database()
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT * FROM sessions
            WHERE user_id = ? AND created_at >= ? AND created_at < ?
            ORDER BY created_at DESC
            """,
            (user_id, start_at.isoformat(), end_at.isoformat()),
        ).fetchall()
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


def list_review_queue(user_id: str = DEFAULT_USER_ID) -> list[ReviewQueue]:
    ensure_database()
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
            WHERE rq.user_id = ?
            ORDER BY rq.next_review_at ASC
            """,
            (user_id,),
        ).fetchall()
    return [_review_from_row(row) for row in rows]


def recommended_expression(user_id: str = DEFAULT_USER_ID) -> Expression:
    due_reviews = due_review_items(user_id)
    if due_reviews:
        return due_reviews[0].expression

    expressions = list_expressions()
    if not expressions:
        raise HTTPException(status_code=404, detail="Expression not found")

    with connect() as conn:
        rows = conn.execute(
            """
            SELECT expression_id, MAX(created_at) AS last_practiced_at
            FROM sessions
            WHERE user_id = ?
            GROUP BY expression_id
            """,
            (user_id,),
        ).fetchall()

    last_practiced_by_expression = {
        row["expression_id"]: row["last_practiced_at"]
        for row in rows
    }

    unpracticed = [expression for expression in expressions if expression.id not in last_practiced_by_expression]
    if unpracticed:
        return unpracticed[0]

    return min(
        expressions,
        key=lambda expression: last_practiced_by_expression.get(expression.id, ""),
    )


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


def average_session_score_between(start_at: datetime, end_at: datetime, user_id: str = DEFAULT_USER_ID) -> float | None:
    sessions = [session for session in list_sessions_between(start_at, end_at, user_id) if session.total_score is not None]
    if not sessions:
        return None
    return round(sum(session.total_score or 0 for session in sessions) / len(sessions), 1)


def count_practiced_expressions(user_id: str = DEFAULT_USER_ID) -> int:
    ensure_database()
    with connect() as conn:
        row = conn.execute(
            "SELECT COUNT(DISTINCT expression_id) AS count FROM sessions WHERE user_id = ?",
            (user_id,),
        ).fetchone()
    return int(row["count"])


def learning_streak(user_id: str = DEFAULT_USER_ID) -> dict:
    ensure_database()
    with connect() as conn:
        rows = conn.execute(
            "SELECT created_at FROM sessions WHERE user_id = ? ORDER BY created_at DESC",
            (user_id,),
        ).fetchall()

    studied_dates = {datetime.fromisoformat(row["created_at"]).date() for row in rows}
    today = datetime.now(timezone.utc).date()
    streak_days = 0
    current = today
    while current in studied_dates:
        streak_days += 1
        current -= timedelta(days=1)

    monday = today - timedelta(days=today.weekday())
    week_flags = [(monday + timedelta(days=offset)) in studied_dates for offset in range(7)]
    return {"days": streak_days, "weekFlags": week_flags}


def category_progress(user_id: str = DEFAULT_USER_ID) -> list[CategoryProgress]:
    ensure_database()
    expressions = list_expressions()

    with connect() as conn:
        rows = conn.execute(
            """
            SELECT expression_id, MAX(total_score) AS best_score
            FROM sessions
            WHERE user_id = ?
            GROUP BY expression_id
            """,
            (user_id,),
        ).fetchall()

    best_by_expression = {
        row["expression_id"]: float(row["best_score"]) if row["best_score"] is not None else None
        for row in rows
    }

    progress: list[CategoryProgress] = []
    for category in ["life", "business", "it", "custom"]:
        category_expressions = [expression for expression in expressions if expression.category == category]
        if not category_expressions and category != "custom":
            continue

        situations: list[SituationItem] = []
        situation_names = sorted({expression.situation_ko for expression in category_expressions})
        for index, situation_ko in enumerate(situation_names, start=1):
            situation_expressions = [expression for expression in category_expressions if expression.situation_ko == situation_ko]
            completed = [expression for expression in situation_expressions if expression.id in best_by_expression]
            best_scores = [best_by_expression[expression.id] for expression in completed if best_by_expression[expression.id] is not None]
            first = situation_expressions[0]
            situations.append(
                SituationItem(
                    id=f"{category}-{index}",
                    idx=f"{index:02d}",
                    name=situation_ko,
                    name_en=first.situation,
                    total_expressions=len(situation_expressions),
                    completed_expressions=len(completed),
                    best_score=max(best_scores) if best_scores else None,
                )
            )

        progress.append(
            CategoryProgress(
                category=category,
                name=CATEGORY_NAMES[category],
                total=len(category_expressions),
                completed=sum(1 for expression in category_expressions if expression.id in best_by_expression),
                situations=situations,
            )
        )

    return progress
