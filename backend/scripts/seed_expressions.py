"""Seed all 30 expressions from `lib/mocks/expressions.mock.ts` into the DB.

The deployed DB only has the 5 expressions hardcoded in app/services/mock_data.py.
This script seeds the remaining ones so dialogue_turns FK to expression_id holds.

Usage:
    cd backend
    set -a && source .env && set +a
    PYTHONPATH=. .venv/bin/python scripts/seed_expressions.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

# Import the existing parser
sys.path.insert(0, str(BACKEND_DIR / "scripts"))
from generate_dialogues import parse_expressions, EXPRESSIONS_TS  # noqa: E402


def main() -> int:
    from app.database import connect, database_backend, ensure_database  # noqa: PLC0415

    expressions = parse_expressions(EXPRESSIONS_TS)
    print(f"Parsed {len(expressions)} expressions from {EXPRESSIONS_TS.name}.")

    ensure_database()
    inserted = 0
    skipped = 0
    with connect() as conn:
        for expr in expressions:
            # Default chunks: simple split by ' ' (not used by dialogue feature)
            chunks_json = json.dumps([expr["textEn"]], ensure_ascii=False)
            sql_pg = """
                INSERT INTO expressions (id, category, situation, situation_ko, level, text_en, text_ko, audio_url, chunks_json, is_custom)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON CONFLICT (id) DO NOTHING
            """
            sql_sqlite = """
                INSERT OR IGNORE INTO expressions (id, category, situation, situation_ko, level, text_en, text_ko, audio_url, chunks_json, is_custom)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
            sql = sql_pg if database_backend() == "postgresql" else sql_sqlite
            try:
                cursor = conn.execute(
                    sql,
                    (
                        expr["id"],
                        expr["category"],
                        expr["situation"],
                        expr["situationKo"],
                        expr["level"],
                        expr["textEn"],
                        expr["textKo"],
                        None,
                        chunks_json,
                        False if database_backend() == "postgresql" else 0,
                    ),
                )
                affected = getattr(cursor, "rowcount", None)
                if affected and affected > 0:
                    inserted += 1
                    print(f"  + {expr['id']} | {expr['situationKo']} | {expr['textEn'][:48]}")
                else:
                    skipped += 1
            except Exception as exc:  # noqa: BLE001
                print(f"  ✗ {expr['id']} failed: {exc}", file=sys.stderr)
        conn.commit()
    print(f"\nInserted {inserted}, skipped (already present) {skipped}, total {len(expressions)}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
