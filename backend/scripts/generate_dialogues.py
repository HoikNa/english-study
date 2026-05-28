"""Generate one dialogue per Expression via GPT-4o.

Reads `lib/mocks/expressions.mock.ts` (30 expressions), prompts GPT-4o for a
natural 6~8 turn dialogue that contains the key expression verbatim, and
writes `lib/mocks/dialogues.mock.ts`.

Usage:
    cd backend
    OPENAI_API_KEY=... .venv/bin/python scripts/generate_dialogues.py

Re-run is idempotent (overwrites the file). Costs ~$0.30 in GPT-4o calls.
"""
from __future__ import annotations

import json
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

from openai import OpenAI

ROOT = Path(__file__).resolve().parents[2]
EXPRESSIONS_TS = ROOT / "lib" / "mocks" / "expressions.mock.ts"
OUTPUT_TS = ROOT / "lib" / "mocks" / "dialogues.mock.ts"

VOICE_PAIRS = [
    ("echo", "fable"),
    ("alloy", "onyx"),
    ("shimmer", "echo"),
    ("onyx", "alloy"),
    ("nova", "echo"),
    ("fable", "onyx"),
    ("shimmer", "fable"),
    ("echo", "shimmer"),
]

# Category-specific role hints to keep dialogues realistic
ROLE_HINT = {
    "Lease / Rent": "real-estate agent",
    "Medical": "doctor or pharmacist",
    "School": "elementary school teacher",
    "Shopping": "store clerk",
    "Dining": "server / waiter",
    "DMV": "DMV clerk",
    "Bank": "bank teller",
    "Office": "post-office clerk",
    "Neighborhood": "next-door neighbor",
    "Emergency": "911 operator",
    "Partnership Meeting": "US client CTO named Marcus",
    "Opinion": "US client CTO named Marcus",
    "Requirements": "US PM named Sarah",
    "Clarification": "American manager",
    "Scheduling": "American colleague",
    "Tech Description": "American partner engineer",
    "Follow-up": "American colleague",
    "5G/LTE": "American carrier engineer",
    "IoT Platform": "American product manager",
    "Cloud Architecture": "American solution architect",
    "API Integration": "American backend engineer",
    "Sprint": "American scrum master",
    "Debugging": "American QA engineer",
    "Code Review": "American senior engineer",
    "Sensors": "American hardware engineer",
    "MVP": "American product director",
    "Security": "American security engineer",
}


def parse_expressions(ts_path: Path) -> list[dict]:
    """Extract expressions from the TS mock file using regex."""
    content = ts_path.read_text(encoding="utf-8")
    pattern = re.compile(
        r"id:\s*'(?P<id>exp-\d+)',\s*"
        r"category:\s*'(?P<category>\w+)',\s*"
        r"situation:\s*'(?P<situation>[^']+)',\s*"
        r"situationKo:\s*'(?P<situationKo>[^']+)',\s*"
        r"level:\s*(?P<level>\d+),\s*"
        r"textEn:\s*(?P<eq1>[\"'])(?P<textEn>.+?)(?P=eq1),\s*"
        r"textKo:\s*(?P<eq2>[\"'])(?P<textKo>.+?)(?P=eq2),",
        re.DOTALL,
    )
    out = []
    for m in pattern.finditer(content):
        out.append({
            "id": m.group("id"),
            "category": m.group("category"),
            "situation": m.group("situation"),
            "situationKo": m.group("situationKo"),
            "level": int(m.group("level")),
            "textEn": m.group("textEn"),
            "textKo": m.group("textKo"),
        })
    return out


SYSTEM_PROMPT = (
    "You are an English dialogue writer for an app that helps a Korean adult learner "
    "practice real-world conversations. Output strict JSON only, no markdown."
)


def build_user_prompt(expr: dict) -> str:
    role = ROLE_HINT.get(expr["situation"], "an American counterpart")
    return f"""Write a natural 6 to 8 turn English dialogue between two speakers.

Situation: {expr['situationKo']} ({expr['situation']})
Category: {expr['category']}
Level: {expr['level']}
Speaker A: {role}
Speaker B: the Korean learner ('You') — adult IT product planner who moved to the US

KEY EXPRESSION (must appear EXACTLY, word-for-word, as one of B's turns):
"{expr['textEn']}"
KEY EXPRESSION 한국어 의미: "{expr['textKo']}"

Rules:
1. Exactly 2 speakers (A and B). B = the learner.
2. The KEY EXPRESSION must appear verbatim (preserve punctuation/apostrophes) in exactly ONE of B's turns.
3. Each turn: 1~2 sentences, natural everyday English. Not textbook-stilted.
4. Provide both English (textEn) and Korean translation (textKo) for every turn.
5. Total: 6 to 8 turns. Start with A's opening, alternate naturally.
6. The dialogue should make sense for a Korean adult encountering this situation in the US.

Output strict JSON only:
{{
  "speakerAName": "concise role/name, e.g. 'Marcus', 'Doctor', 'Agent', 'Teacher'",
  "turns": [
    {{"speaker": "A", "textEn": "...", "textKo": "..."}},
    {{"speaker": "B", "textEn": "...", "textKo": "..."}}
  ],
  "keyTurnIndex": 1
}}
"""


def generate_one(client: OpenAI, expr: dict, attempt: int = 1) -> dict | None:
    try:
        resp = client.chat.completions.create(
            model="gpt-4o",
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": build_user_prompt(expr)},
            ],
            temperature=0.7,
        )
    except Exception as exc:  # noqa: BLE001
        print(f"  [{expr['id']}] API error (attempt {attempt}): {exc}", file=sys.stderr)
        if attempt < 2:
            time.sleep(2)
            return generate_one(client, expr, attempt + 1)
        return None

    raw = resp.choices[0].message.content
    try:
        data = json.loads(raw)
    except json.JSONDecodeError as exc:
        print(f"  [{expr['id']}] invalid JSON: {exc}", file=sys.stderr)
        return None

    turns = data.get("turns") or []
    key_idx = data.get("keyTurnIndex")
    if not isinstance(turns, list) or not turns:
        print(f"  [{expr['id']}] no turns returned", file=sys.stderr)
        return None
    if not isinstance(key_idx, int) or not 0 <= key_idx < len(turns):
        # Fall back: find first B turn containing the expression
        for i, t in enumerate(turns):
            if t.get("speaker") == "B" and expr["textEn"] in (t.get("textEn") or ""):
                key_idx = i
                break
        else:
            print(f"  [{expr['id']}] key expression not found, falling back to turn 1", file=sys.stderr)
            key_idx = 1

    # Validate: key expression must appear in the key turn
    key_text_en = turns[key_idx].get("textEn") or ""
    if expr["textEn"] not in key_text_en and attempt < 2:
        print(f"  [{expr['id']}] key expression missing in turn {key_idx}, retrying...", file=sys.stderr)
        return generate_one(client, expr, attempt + 1)

    data["turns"] = turns
    data["keyTurnIndex"] = key_idx
    return data


def ts_str(value: str) -> str:
    """Escape a string for TS double-quoted literal."""
    escaped = value.replace("\\", "\\\\").replace('"', '\\"').replace("\n", "\\n")
    return f'"{escaped}"'


def format_dialogue_ts(expr: dict, data: dict, voice_a: str, voice_b: str) -> str:
    dlg_id = expr["id"].replace("exp-", "dlg-")
    speaker_a_name = data.get("speakerAName") or "A"
    turns = data["turns"]
    key_idx = data["keyTurnIndex"]

    lines = [
        "  {",
        f"    id: '{dlg_id}',",
        f"    situationKo: {ts_str(expr['situationKo'])},",
        f"    situationEn: {ts_str(expr['situation'])},",
        f"    category: '{expr['category']}',",
        f"    level: {expr['level']},",
        f"    speakerAVoice: '{voice_a}',",
        f"    speakerBVoice: '{voice_b}',",
        f"    speakerAName: {ts_str(speaker_a_name)},",
        "    speakerBName: 'You',",
        "    turns: [",
    ]
    for i, turn in enumerate(turns):
        speaker = turn.get("speaker", "A")
        text_en = turn.get("textEn", "")
        text_ko = turn.get("textKo", "")
        parts = [
            f"id: 't{i + 1}'",
            f"speaker: '{speaker}'",
            f"textEn: {ts_str(text_en)}",
            f"textKo: {ts_str(text_ko)}",
        ]
        if i == key_idx:
            parts.append(f"expressionId: '{expr['id']}'")
        lines.append("      { " + ", ".join(parts) + " },")
    lines.append("    ],")
    lines.append("  },")
    return "\n".join(lines)


HEADER = """import type { Dialogue } from '@/types';

/**
 * Auto-generated by backend/scripts/generate_dialogues.py.
 * Edit the script (or this file directly) to regenerate.
 *
 * Each entry is a 6~8 turn dialogue containing one key expression that the
 * learner shadows. Speaker A is the counterpart (agent/doctor/CTO/etc.),
 * speaker B is the learner ("You").
 */
export const mockDialogues: Dialogue[] = [
"""

FOOTER = """];

/**
 * 오늘의 dialogue 선택: day-of-year % 개수로 회전. 백엔드 구현 시 사용자 학습
 * 진척/취약 카테고리 기반 추천으로 교체.
 */
export function pickTodayDialogue(now: Date = new Date()) {
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return mockDialogues[dayOfYear % mockDialogues.length];
}

export const mockTodayDialogue = pickTodayDialogue();
"""


def main() -> int:
    api_key = os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("error: OPENAI_API_KEY environment variable required", file=sys.stderr)
        return 1

    expressions = parse_expressions(EXPRESSIONS_TS)
    if not expressions:
        print(f"error: no expressions parsed from {EXPRESSIONS_TS}", file=sys.stderr)
        return 1

    print(f"Parsed {len(expressions)} expressions.")
    print(f"Generating dialogues via GPT-4o (parallel up to 5)...")

    client = OpenAI(api_key=api_key)
    results: list[tuple[dict, dict | None]] = [(e, None) for e in expressions]

    with ThreadPoolExecutor(max_workers=5) as pool:
        future_to_idx = {
            pool.submit(generate_one, client, expr): idx
            for idx, expr in enumerate(expressions)
        }
        for fut in as_completed(future_to_idx):
            idx = future_to_idx[fut]
            data = fut.result()
            results[idx] = (results[idx][0], data)
            expr = results[idx][0]
            status = "ok" if data else "FAILED"
            print(f"  [{expr['id']}] {expr['situationKo']} → {status}")

    successful = [(e, d) for e, d in results if d is not None]
    print(f"\nGenerated {len(successful)} / {len(results)} dialogues.")

    if not successful:
        print("error: no dialogues generated", file=sys.stderr)
        return 2

    ts_blocks: list[str] = []
    for idx, (expr, data) in enumerate(successful):
        voice_a, voice_b = VOICE_PAIRS[idx % len(VOICE_PAIRS)]
        ts_blocks.append(format_dialogue_ts(expr, data, voice_a, voice_b))

    output = HEADER + "\n".join(ts_blocks) + "\n" + FOOTER
    OUTPUT_TS.write_text(output, encoding="utf-8")
    print(f"\nWrote {OUTPUT_TS} ({len(successful)} dialogues).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
