"""Pre-cache TTS for every dialogue turn into Supabase Storage and persist the
public URL on `dialogue_turns.audio_url`.

After running, the frontend can play each turn directly from the stored URL
without round-tripping through `/api/v1/ai/tts/generate`, removing the per-turn
generation latency on first listen.

Usage:
    cd backend
    set -a && source .env && set +a
    PYTHONPATH=. .venv/bin/python scripts/precache_dialogue_tts.py [--force]

Re-running is idempotent (skips turns that already have audio_url unless --force).
Cost: 30 dialogues * ~6 turns = ~180 OpenAI TTS calls. tts-1 is $0.015/1k chars,
each turn ~80 chars ⇒ ~$0.22 total. Subsequent runs hit Supabase cache → free.
"""
from __future__ import annotations

import argparse
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

from app.database import connect, database_backend, ensure_database  # noqa: E402
from app.services.openai_tts import get_tts_url  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--force", action="store_true", help="re-generate even if audio_url already set")
    parser.add_argument("--limit", type=int, help="limit number of turns to process")
    parser.add_argument("--workers", type=int, default=4, help="parallel workers (default 4)")
    args = parser.parse_args()

    ensure_database()
    with connect() as conn:
        rows = conn.execute(
            """
            SELECT dt.id, dt.dialogue_id, dt.turn_index, dt.speaker, dt.text_en, dt.audio_url,
                   d.speaker_a_voice, d.speaker_b_voice
            FROM dialogue_turns dt
            JOIN dialogues d ON d.id = dt.dialogue_id
            ORDER BY dt.dialogue_id ASC, dt.turn_index ASC
            """
        ).fetchall()

    turns = []
    for row in rows:
        audio_url = None
        try:
            audio_url = row["audio_url"]
        except (KeyError, IndexError):
            pass
        if audio_url and not args.force:
            continue
        voice = row["speaker_a_voice"] if row["speaker"] == "A" else row["speaker_b_voice"]
        turns.append({
            "id": row["id"],
            "text_en": row["text_en"],
            "voice": voice,
        })

    if args.limit:
        turns = turns[: args.limit]

    if not turns:
        print("All turns already have audio_url. Use --force to regenerate.")
        return 0

    print(f"Pre-caching {len(turns)} turns (parallel={args.workers})...")

    def work(turn: dict) -> tuple[dict, str | None, str | None]:
        try:
            url = get_tts_url(turn["text_en"], speed=1.0, voice=turn["voice"])
            return turn, url, None
        except Exception as exc:  # noqa: BLE001
            return turn, None, str(exc)

    pg = database_backend() == "postgresql"
    update_sql = "UPDATE dialogue_turns SET audio_url = ? WHERE id = ?"

    succeeded = 0
    failed = 0
    with ThreadPoolExecutor(max_workers=args.workers) as pool:
        futures = [pool.submit(work, t) for t in turns]
        for fut in as_completed(futures):
            turn, url, err = fut.result()
            if err or not url:
                print(f"  ✗ {turn['id']} ({turn['voice']}) failed: {err}", file=sys.stderr)
                failed += 1
                continue
            with connect() as conn:
                conn.execute(update_sql, (url, turn["id"]))
                conn.commit()
            succeeded += 1
            preview = turn["text_en"][:48].replace("\n", " ")
            print(f"  ✓ {turn['id']} | {turn['voice']:7} | {preview}")

    print(f"\nDone. {succeeded} ok, {failed} failed.")
    return 0 if failed == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
