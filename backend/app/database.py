from __future__ import annotations

import json
import sqlite3
from pathlib import Path
from threading import Lock
from typing import Any

import psycopg2
from psycopg2.extras import RealDictCursor

from app.config import get_settings
from app.services.mock_data import EXPRESSIONS, REVIEW_QUEUE

_INIT_LOCK = Lock()
_INITIALIZED = False


def database_backend(database_url: str | None = None) -> str:
    url = database_url or get_settings().database_url
    if url.startswith("sqlite:///"):
        return "sqlite"
    if url.startswith(("postgresql://", "postgres://")):
        return "postgresql"
    raise RuntimeError("DATABASE_URL must start with sqlite:///, postgresql://, or postgres://")


def _sqlite_path(database_url: str | None = None) -> str:
    database_url = database_url or get_settings().database_url
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


def _postgres_query(query: str) -> str:
    return query.replace("?", "%s")


class PostgresConnection:
    def __init__(self, database_url: str):
        self._conn = psycopg2.connect(database_url, cursor_factory=RealDictCursor)

    def __enter__(self) -> "PostgresConnection":
        return self

    def __exit__(self, exc_type, exc, traceback) -> None:
        if exc_type is None:
            self._conn.commit()
        else:
            self._conn.rollback()
        self._conn.close()

    def execute(self, query: str, params: tuple[Any, ...] | list[Any] = ()):
        cursor = self._conn.cursor()
        cursor.execute(_postgres_query(query), params)
        return cursor

    def executescript(self, script: str) -> None:
        statements = [stmt.strip() for stmt in script.split(";") if stmt.strip()]
        cursor = self._conn.cursor()
        try:
            for stmt in statements:
                cursor.execute(stmt)
                self._conn.commit()
        except Exception:
            self._conn.rollback()
            raise

    def commit(self) -> None:
        self._conn.commit()


def connect() -> sqlite3.Connection | PostgresConnection:
    settings = get_settings()
    if database_backend(settings.database_url) == "postgresql":
        return PostgresConnection(settings.database_url)

    conn = sqlite3.connect(_sqlite_path(settings.database_url))
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def initialize_database() -> None:
    global _INITIALIZED

    with _INIT_LOCK:
        if _INITIALIZED:
            return

        backend = database_backend()
        with connect() as conn:
            if backend == "postgresql":
                conn.execute("SELECT pg_advisory_lock(93571001)")
            try:
                if backend == "postgresql":
                    _create_postgres_schema(conn)
                else:
                    _create_sqlite_schema(conn)
                _migrate_database(conn, backend)
                _seed_database(conn, backend)
                conn.commit()
            except Exception:
                if backend == "postgresql":
                    conn._conn.rollback()
                raise
            finally:
                if backend == "postgresql":
                    conn.execute("SELECT pg_advisory_unlock(93571001)")

        _INITIALIZED = True


def _create_sqlite_schema(conn: sqlite3.Connection) -> None:
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
            is_deleted INTEGER NOT NULL DEFAULT 0,
            owner_user_id TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (owner_user_id) REFERENCES users(id)
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

        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TEXT NOT NULL,
            revoked_at TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            replaced_by_token_id TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_expression_created
            ON sessions(expression_id, created_at DESC);

        CREATE INDEX IF NOT EXISTS idx_review_queue_due
            ON review_queue(user_id, next_review_at);

        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_active
            ON refresh_tokens(user_id, revoked_at, expires_at);

        CREATE TABLE IF NOT EXISTS dialogues (
            id TEXT PRIMARY KEY,
            situation_ko TEXT NOT NULL,
            situation_en TEXT,
            category TEXT NOT NULL,
            level INTEGER NOT NULL,
            speaker_a_voice TEXT NOT NULL DEFAULT 'echo',
            speaker_b_voice TEXT NOT NULL DEFAULT 'fable',
            speaker_a_name TEXT,
            speaker_b_name TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS dialogue_turns (
            id TEXT PRIMARY KEY,
            dialogue_id TEXT NOT NULL,
            turn_index INTEGER NOT NULL,
            speaker TEXT NOT NULL,
            text_en TEXT NOT NULL,
            text_ko TEXT,
            expression_id TEXT,
            audio_url TEXT,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
            UNIQUE (dialogue_id, turn_index),
            FOREIGN KEY (dialogue_id) REFERENCES dialogues(id) ON DELETE CASCADE,
            FOREIGN KEY (expression_id) REFERENCES expressions(id)
        );

        CREATE INDEX IF NOT EXISTS idx_dialogue_turns_dialogue
            ON dialogue_turns(dialogue_id, turn_index);
        """
    )
    # Defensive: add audio_url to pre-existing tables (no-op if already present)
    try:
        conn.execute("ALTER TABLE dialogue_turns ADD COLUMN audio_url TEXT")
    except Exception:  # noqa: BLE001
        pass


def _create_postgres_schema(conn: PostgresConnection) -> None:
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            email TEXT UNIQUE,
            password_hash TEXT,
            nickname TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP::TEXT),
            updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP::TEXT)
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
            is_custom BOOLEAN NOT NULL DEFAULT FALSE,
            is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
            owner_user_id TEXT REFERENCES users(id),
            created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP::TEXT)
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
            updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP::TEXT),
            UNIQUE (user_id, expression_id),
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (expression_id) REFERENCES expressions(id)
        );

        CREATE TABLE IF NOT EXISTS refresh_tokens (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            token_hash TEXT NOT NULL UNIQUE,
            expires_at TEXT NOT NULL,
            revoked_at TEXT,
            created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP::TEXT),
            replaced_by_token_id TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
        );

        CREATE INDEX IF NOT EXISTS idx_sessions_expression_created
            ON sessions(expression_id, created_at DESC);

        CREATE INDEX IF NOT EXISTS idx_review_queue_due
            ON review_queue(user_id, next_review_at);

        CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_active
            ON refresh_tokens(user_id, revoked_at, expires_at);

        CREATE TABLE IF NOT EXISTS dialogues (
            id TEXT PRIMARY KEY,
            situation_ko TEXT NOT NULL,
            situation_en TEXT,
            category TEXT NOT NULL,
            level INTEGER NOT NULL,
            speaker_a_voice TEXT NOT NULL DEFAULT 'echo',
            speaker_b_voice TEXT NOT NULL DEFAULT 'fable',
            speaker_a_name TEXT,
            speaker_b_name TEXT,
            created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP::TEXT)
        );

        CREATE TABLE IF NOT EXISTS dialogue_turns (
            id TEXT PRIMARY KEY,
            dialogue_id TEXT NOT NULL REFERENCES dialogues(id) ON DELETE CASCADE,
            turn_index INTEGER NOT NULL,
            speaker TEXT NOT NULL,
            text_en TEXT NOT NULL,
            text_ko TEXT,
            expression_id TEXT,
            audio_url TEXT,
            created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP::TEXT),
            UNIQUE (dialogue_id, turn_index)
        );

        CREATE INDEX IF NOT EXISTS idx_dialogue_turns_dialogue
            ON dialogue_turns(dialogue_id, turn_index);
        ALTER TABLE dialogue_turns ADD COLUMN IF NOT EXISTS audio_url TEXT;
        """
    )


def _seed_database(conn, backend: str) -> None:
    if backend == "postgresql":
        conn.execute(
            """
            INSERT INTO users (id, email, nickname)
            VALUES ('dev-user', 'dev@speakready.local', 'Hoik')
            ON CONFLICT (id) DO NOTHING
            """
        )
    else:
        conn.execute(
            """
            INSERT OR IGNORE INTO users (id, email, nickname)
            VALUES ('dev-user', 'dev@speakready.local', 'Hoik')
            """
        )

    for expression in EXPRESSIONS:
        expression_sql = """
            INSERT INTO expressions (
                id, category, situation, situation_ko, level, text_en, text_ko,
                audio_url, chunks_json, is_custom
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """
        if backend == "postgresql":
            expression_sql += " ON CONFLICT (id) DO NOTHING"
        else:
            expression_sql = expression_sql.replace("INSERT INTO", "INSERT OR IGNORE INTO", 1)

        conn.execute(
            expression_sql,
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
                bool(expression.is_custom) if backend == "postgresql" else int(expression.is_custom),
            ),
        )

    for queue in REVIEW_QUEUE.values():
        queue_sql = """
            INSERT INTO review_queue (
                id, user_id, expression_id, interval, repetition, ef,
                next_review_at, last_score, total_attempts
            )
            VALUES (?, 'dev-user', ?, ?, ?, ?, ?, ?, ?)
        """
        if backend == "postgresql":
            queue_sql += " ON CONFLICT (user_id, expression_id) DO NOTHING"
        else:
            queue_sql = queue_sql.replace("INSERT INTO", "INSERT OR IGNORE INTO", 1)

        conn.execute(
            queue_sql,
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


def _column_names(conn, table_name: str, backend: str) -> set[str]:
    if backend == "postgresql":
        rows = conn.execute(
            """
            SELECT column_name AS name
            FROM information_schema.columns
            WHERE table_schema = current_schema() AND table_name = ?
            """,
            (table_name,),
        ).fetchall()
    else:
        rows = conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    return {row["name"] for row in rows}


def _migrate_database(conn, backend: str) -> None:
    if backend == "postgresql":
        _migrate_postgres_database(conn)
        return

    user_columns = {row["name"] for row in conn.execute("PRAGMA table_info(users)").fetchall()}
    if "password_hash" not in user_columns:
        conn.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
    if "updated_at" not in user_columns:
        conn.execute("ALTER TABLE users ADD COLUMN updated_at TEXT")
        conn.execute("UPDATE users SET updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)")

    expression_columns = {row["name"] for row in conn.execute("PRAGMA table_info(expressions)").fetchall()}
    if "is_deleted" not in expression_columns:
        conn.execute("ALTER TABLE expressions ADD COLUMN is_deleted INTEGER NOT NULL DEFAULT 0")
    if "owner_user_id" not in expression_columns:
        conn.execute("ALTER TABLE expressions ADD COLUMN owner_user_id TEXT REFERENCES users(id)")


def _migrate_postgres_database(conn: PostgresConnection) -> None:
    user_columns = _column_names(conn, "users", "postgresql")
    if "password_hash" not in user_columns:
        conn.execute("ALTER TABLE users ADD COLUMN password_hash TEXT")
    if "updated_at" not in user_columns:
        conn.execute("ALTER TABLE users ADD COLUMN updated_at TEXT")
        conn.execute("UPDATE users SET updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP::TEXT)")

    expression_columns = _column_names(conn, "expressions", "postgresql")
    if "is_deleted" not in expression_columns:
        conn.execute("ALTER TABLE expressions ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE")
    if "owner_user_id" not in expression_columns:
        conn.execute("ALTER TABLE expressions ADD COLUMN owner_user_id TEXT REFERENCES users(id)")


def ensure_database() -> None:
    initialize_database()


def reset_database_state_for_tests() -> None:
    global _INITIALIZED
    with _INIT_LOCK:
        _INITIALIZED = False
