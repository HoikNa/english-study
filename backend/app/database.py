from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from threading import Lock

from app.config import get_settings
from app.services.mock_data import EXPRESSIONS, REVIEW_QUEUE

_INIT_LOCK = Lock()
_INITIALIZED = False


def _sqlite_path() -> str:
    database_url = get_settings().database_url
    if not database_url.startswith("sqlite:///"):
        raise RuntimeError("Only sqlite:/// DATABASE_URL values are supported in the local backend")

    raw_path = database_url.removeprefix("sqlite:///")
    if raw_path == ":memory:":
        return raw_path

    path = Path(raw_path)
    if not path.is_absolute():
        cwd = Path.cwd()
        if path.parts[:1] == ("backend",) and cwd.name == "backend":
            path = cwd.parent / path
        else:
            path = cwd / path

    path.parent.mkdir(parents=True, exist_ok=True)
    return str(path)


def connect() -> sqlite3.Connection:
    conn = sqlite3.connect(_sqlite_path())
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def initialize_database() -> None:
    global _INITIALIZED

    with _INIT_LOCK:
        if _INITIALIZED:
            return

        with connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS users (
                    id TEXT PRIMARY KEY,
                    email TEXT UNIQUE,
                    password_hash TEXT,
                    nickname TEXT NOT NULL,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS expressions (
                    id TEXT PRIMARY KEY,
                    category TEXT NOT NULL,
                    situation TEXT NOT NULL,
                    situation_ko TEXT NOT NULL,
                    level INTEGER NOT NULL,
                    text_en TEXT NOT NULL,
                    text_ko TEXT NOT NULL,
                    audio_url TEXT,
                    chunks_json TEXT NOT NULL,
                    is_custom INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
                );

                CREATE TABLE IF NOT EXISTS sessions (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL DEFAULT 'dev-user',
                    expression_id TEXT NOT NULL,
                    attempt_number INTEGER NOT NULL,
                    pron_score REAL,
                    fluency_score REAL,
                    prosody_score REAL,
                    completeness_score REAL,
                    total_score REAL,
                    recognized_text TEXT,
                    word_errors_json TEXT,
                    gpt_feedback_json TEXT,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (expression_id) REFERENCES expressions(id)
                );

                CREATE TABLE IF NOT EXISTS review_queue (
                    id TEXT PRIMARY KEY,
                    user_id TEXT NOT NULL DEFAULT 'dev-user',
                    expression_id TEXT NOT NULL,
                    interval INTEGER NOT NULL,
                    repetition INTEGER NOT NULL,
                    ef REAL NOT NULL,
                    next_review_at TEXT NOT NULL,
                    last_score REAL,
                    total_attempts INTEGER NOT NULL DEFAULT 0,
                    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE (user_id, expression_id),
                    FOREIGN KEY (user_id) REFERENCES users(id),
                    FOREIGN KEY (expression_id) REFERENCES expressions(id)
                );

                CREATE INDEX IF NOT EXISTS idx_sessions_expression_created
                    ON sessions(expression_id, created_at DESC);

                CREATE INDEX IF NOT EXISTS idx_review_queue_due
                    ON review_queue(user_id, next_review_at);
                """
            )
            _migrate_database(conn)
            _seed_database(conn)
            conn.commit()

        _INITIALIZED = True


def _seed_database(conn: sqlite3.Connection) -> None:
    conn.execute(
        """
        INSERT OR IGNORE INTO users (id, email, nickname)
        VALUES ('dev-user', 'dev@speakready.local', 'Hoik')
        """
    )

    for expression in EXPRESSIONS:
        conn.execute(
            """
            INSERT OR IGNORE INTO expressions (
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

    for queue in REVIEW_QUEUE.values():
        conn.execute(
            """
            INSERT OR IGNORE INTO review_queue (
                id, user_id, expression_id, interval, repetition, ef,
                next_review_at, last_score, total_attempts
            )
            VALUES (?, 'dev-user', ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                queue.id,
                queue.expression_id,
                queue.interval,
                queue.repetition,
                queue.ef,
                queue.next_review_at,
                queue.last_score,
                queue.total_attempts,
            ),
        )


def _migrate_database(conn: sqlite3.Connection) -> None:
    user_columns = {row["name"] for row in conn.execute("PRAGMA table_info(users)").fetchall()}
    if "password_hash" not in user_columns:
        conn.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
    if "updated_at" not in user_columns:
        conn.execute("ALTER TABLE users ADD COLUMN updated_at TEXT")
        conn.execute("UPDATE users SET updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)")


def ensure_database() -> None:
    initialize_database()


def reset_database_state_for_tests() -> None:
    global _INITIALIZED
    with _INIT_LOCK:
        _INITIALIZED = False
