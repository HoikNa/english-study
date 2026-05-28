"""Pre-cache TTS for every example in lib/data/sound_blocks.ts.

Writes a JSON sidecar `lib/data/sound_block_audio.json` mapping:
    { blockId: [audioUrl_for_idx0, audioUrl_for_idx1, ...] }

Uses the same voice rotation as the frontend (`['echo','nova','shimmer','fable'][idx % 4]`),
so the cached audio matches whatever the block detail screen would request.

Usage:
    cd backend
    set -a && source .env && set +a
    PYTHONPATH=. .venv/bin/python scripts/precache_block_tts.py
"""
from __future__ import annotations

import json
import re
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

BLOCKS_TS = ROOT / "lib" / "data" / "sound_blocks.ts"
AUDIO_JSON = ROOT / "lib" / "data" / "sound_block_audio.json"

EXAMPLE_VOICES = ["echo", "nova", "shimmer", "fable"]


def _unescape(value: str) -> str:
    return value.replace('\\"', '"').replace("\\'", "'").replace("\\n", "\n").replace("\\\\", "\\")


def parse_blocks(text: str) -> list[dict]:
    """Extract (blockId, examples[]) from sound_blocks.ts.

    Robust approach: split by `id: 'sb-` marker, then bracket-count to find each
    block's examples array.
    """
    example_pattern = re.compile(
        r"\{\s*en:\s*(?P<eq1>[\"'])(?P<en>.+?)(?<!\\)(?P=eq1),\s*"
        r"ko:\s*(?P<eq2>[\"'])(?P<ko>.+?)(?<!\\)(?P=eq2)\s*\}",
        re.DOTALL,
    )

    out: list[dict] = []
    # Find every block id and parse forward from there
    for id_match in re.finditer(r"id:\s*'(sb-[a-z0-9\-]+)'", text):
        block_id = id_match.group(1)
        # Find the examples: [ in this block (before the next id: marker)
        examples_start = text.find("examples: [", id_match.end())
        if examples_start == -1:
            continue
        # Make sure the examples block belongs to this block (no other id: in between)
        next_id = text.find("id: 'sb-", id_match.end())
        if next_id != -1 and next_id < examples_start:
            continue

        # Bracket-count from `[` to find matching `]`
        i = text.find("[", examples_start)
        depth = 0
        end = -1
        in_str = None  # quote char if inside string
        while i < len(text):
            c = text[i]
            if in_str:
                if c == "\\":
                    i += 2
                    continue
                if c == in_str:
                    in_str = None
            else:
                if c in ('"', "'"):
                    in_str = c
                elif c == "[":
                    depth += 1
                elif c == "]":
                    depth -= 1
                    if depth == 0:
                        end = i
                        break
            i += 1

        if end == -1:
            continue
        arr = text[text.find("[", examples_start) + 1: end]
        examples = []
        for xm in example_pattern.finditer(arr):
            examples.append({
                "en": _unescape(xm.group("en")),
                "ko": _unescape(xm.group("ko")),
            })
        out.append({"id": block_id, "examples": examples})
    return out


def main() -> int:
    from app.services.openai_tts import get_tts_url  # noqa: PLC0415

    text = BLOCKS_TS.read_text(encoding="utf-8")
    blocks = parse_blocks(text)
    if not blocks:
        print(f"error: no blocks parsed from {BLOCKS_TS}", file=sys.stderr)
        return 1

    total_examples = sum(len(b["examples"]) for b in blocks)
    print(f"Parsed {len(blocks)} blocks with {total_examples} total examples.")
    print("Generating TTS (parallel up to 6)...")

    tasks: list[tuple[str, int, str, str]] = []  # (block_id, idx, text, voice)
    for block in blocks:
        for idx, ex in enumerate(block["examples"]):
            voice = EXAMPLE_VOICES[idx % len(EXAMPLE_VOICES)]
            tasks.append((block["id"], idx, ex["en"], voice))

    audio_map: dict[str, list[str | None]] = {b["id"]: [None] * len(b["examples"]) for b in blocks}
    ok = 0
    failed = 0

    def work(task):
        bid, idx, en, voice = task
        try:
            url = get_tts_url(en, 1.0, voice)
            return (bid, idx, url, None)
        except Exception as exc:  # noqa: BLE001
            return (bid, idx, None, str(exc))

    with ThreadPoolExecutor(max_workers=6) as pool:
        futures = [pool.submit(work, t) for t in tasks]
        for fut in as_completed(futures):
            bid, idx, url, err = fut.result()
            if url:
                audio_map[bid][idx] = url
                ok += 1
                en_preview = next((t[2] for t in tasks if t[0] == bid and t[1] == idx), "")[:48]
                voice = EXAMPLE_VOICES[idx % len(EXAMPLE_VOICES)]
                print(f"  ✓ {bid}[{idx}] | {voice:<7} | {en_preview}")
            else:
                failed += 1
                print(f"  ✗ {bid}[{idx}] failed: {err}", file=sys.stderr)

    AUDIO_JSON.write_text(json.dumps(audio_map, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"\nDone. {ok} ok, {failed} failed. Wrote {AUDIO_JSON.relative_to(ROOT)}.")
    return 0 if failed == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
