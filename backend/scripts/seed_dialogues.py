"""Seed dialogues into the DB from `lib/mocks/dialogues.mock.ts`.

Idempotent: re-running replaces rows. Uses DATABASE_URL from backend/.env or
backend/.env.local. The script connects directly via repository.upsert_dialogue
so it works against both sqlite (local) and postgres (deployed).

Usage:
    cd backend
    set -a && source .env && set +a
    .venv/bin/python scripts/seed_dialogues.py
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

# Allow running as a script: ensure backend/ is on sys.path so `app.*` imports work
ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

DIALOGUES_TS = ROOT / "lib" / "mocks" / "dialogues.mock.ts"


def _unescape(value: str) -> str:
    return value.replace('\\"', '"').replace("\\n", "\n").replace("\\\\", "\\")


def parse_dialogues_ts(text: str) -> list[dict]:
    """Extract dialogue objects from the TS mock file. Format is the auto-generated
    layout from generate_dialogues.py — one dialogue per top-level object."""
    # Split into dialogue blocks by `id: 'dlg-` markers
    block_pattern = re.compile(
        r"\{\s*\n\s*id:\s*'(dlg-\d+)',(?P<body>.+?)\n\s*\},",
        re.DOTALL,
    )
    field_re = lambda name: re.compile(
        rf"{name}:\s*(?P<q>[\"'])(?P<value>.*?)(?<!\\)(?P=q),",
        re.DOTALL,
    )

    out: list[dict] = []
    for m in block_pattern.finditer(text):
        dlg_id = m.group(1)
        body = m.group("body")

        def get(name: str) -> str | None:
            mm = field_re(name).search(body)
            return _unescape(mm.group("value")) if mm else None

        situation_ko = get("situationKo") or ""
        situation_en = get("situationEn")
        category_m = re.search(r"category:\s*'(\w+)'", body)
        level_m = re.search(r"level:\s*(\d+)", body)
        voice_a_m = re.search(r"speakerAVoice:\s*'(\w+)'", body)
        voice_b_m = re.search(r"speakerBVoice:\s*'(\w+)'", body)
        speaker_a_name = get("speakerAName")
        speaker_b_name = get("speakerBName")

        # Turns: find the turns array and parse each `{ id: 't1', ... }` row
        turns_block_m = re.search(r"turns:\s*\[(?P<arr>.+?)\n\s*\],", body, re.DOTALL)
        turns: list[dict] = []
        if turns_block_m:
            arr = turns_block_m.group("arr")
            turn_re = re.compile(
                r"\{\s*id:\s*'([^']+)',\s*"
                r"speaker:\s*'([AB])',\s*"
                r"textEn:\s*(?P<eq1>[\"'])(?P<text_en>.+?)(?<!\\)(?P=eq1),\s*"
                r"textKo:\s*(?P<eq2>[\"'])(?P<text_ko>.+?)(?<!\\)(?P=eq2)"
                r"(?:,\s*expressionId:\s*'([^']+)')?"
                r"\s*\}",
                re.DOTALL,
            )
            for tm in turn_re.finditer(arr):
                turns.append({
                    "id": tm.group(1),
                    "speaker": tm.group(2),
                    "text_en": _unescape(tm.group("text_en")),
                    "text_ko": _unescape(tm.group("text_ko")),
                    "expression_id": tm.group(7),
                })

        out.append({
            "id": dlg_id,
            "situation_ko": situation_ko,
            "situation_en": situation_en,
            "category": category_m.group(1) if category_m else "life",
            "level": int(level_m.group(1)) if level_m else 1,
            "speaker_a_voice": voice_a_m.group(1) if voice_a_m else "echo",
            "speaker_b_voice": voice_b_m.group(1) if voice_b_m else "fable",
            "speaker_a_name": speaker_a_name,
            "speaker_b_name": speaker_b_name,
            "turns": turns,
        })
    return out


def main() -> int:
    from app.schemas import DialogueUpsert  # noqa: PLC0415  (after sys.path mutation)
    from app.services import repository  # noqa: PLC0415

    text = DIALOGUES_TS.read_text(encoding="utf-8")
    dialogues = parse_dialogues_ts(text)
    if not dialogues:
        print(f"error: no dialogues parsed from {DIALOGUES_TS}", file=sys.stderr)
        return 1

    print(f"Parsed {len(dialogues)} dialogues from {DIALOGUES_TS.name}.")
    inserted = 0
    for dlg in dialogues:
        # Prefix turn ids with dialogue id so they are globally unique in DB
        for turn in dlg["turns"]:
            if not turn["id"].startswith(dlg["id"]):
                turn["id"] = f"{dlg['id']}-{turn['id']}"
        try:
            payload = DialogueUpsert(**dlg)
            repository.upsert_dialogue(payload)
            inserted += 1
            key_turns = sum(1 for t in dlg["turns"] if t["expression_id"])
            print(f"  ✓ {dlg['id']} | {dlg['situation_ko']} | turns={len(dlg['turns'])} key={key_turns}")
        except Exception as exc:  # noqa: BLE001
            print(f"  ✗ {dlg['id']} failed: {exc}", file=sys.stderr)

    print(f"\nUpserted {inserted}/{len(dialogues)} dialogues.")
    return 0 if inserted == len(dialogues) else 2


if __name__ == "__main__":
    raise SystemExit(main())
