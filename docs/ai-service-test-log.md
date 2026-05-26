# AI Service Test Log

Test date: 2026-05-25

## Environment

| Item | Status |
| --- | --- |
| `AZURE_SPEECH_KEY` | Configured |
| `OPENAI_API_KEY` | Configured |
| `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` | Configured |
| Backend mode | Local FastAPI + SQLite |
| AI behavior | Real API calls for Azure/OpenAI/Supabase |

Secrets were not printed during verification. Only presence/absence was checked.

## Verification Summary

| Service | Result | Notes |
| --- | --- | --- |
| Azure pronunciation assessment | Pass | Test audio generated with Azure Speech SDK, then assessed successfully. |
| GPT feedback | Pass | Uses `OPENAI_FEEDBACK_MODEL=gpt-4.1-nano` with compact prompt. Measured latency is now 2.65s. |
| GPT custom expression | Pass | Returned business category, level 2, and English expression. |
| GPT simulation | Pass | Returned roleplay reply and Korean coach comment. |
| OpenAI TTS | Pass | Generated audio and uploaded through Supabase storage. |
| Supabase TTS cache | Pass | Created missing `tts-cache` bucket, then second call returned the same cached URL in 0.32s. |

## Real API Call Results

| Service | Status | Latency | Detail |
| --- | --- | ---: | --- |
| Azure speech synthesis for test audio | Pass | 0.67s | WAV bytes generated: 98,846 |
| Azure pronunciation assessment | Pass | 1.36s | `total_score`: 78.6, word errors: 6, recognized text present |
| OpenAI GPT feedback | Pass | 5.74s | 3 alternatives, issue length 83 chars |
| OpenAI GPT feedback after latency tuning | Pass | 2.65s | 3 alternatives, issue length 35 chars |
| OpenAI GPT custom expression | Pass | 1.09s | category `business`, level 2 |
| OpenAI GPT simulation | Pass | 1.39s | reply returned, coach comment present |
| Supabase bucket creation | Pass | 0.06s | Created missing `tts-cache` bucket |
| OpenAI TTS + Supabase first call | Pass | 4.55s | Uploaded audio; returned storage URL |
| OpenAI TTS + Supabase second call | Pass | 0.32s | Returned same cached URL |

## Automated Checks Completed

```text
npm run typecheck
Result: passed

npm run backend:test
Result: 19 passed

npm run export:web
Result: passed
```

`docs/openapi.json` was generated from the current FastAPI application and parsed successfully.

## Real API Test Checklist

Use these for regression checks when credentials, prompts, models, or storage settings change.

1. Azure pronunciation
   - Input: short WAV recording + reference sentence.
   - Expected: `pron_score`, `fluency_score`, `prosody_score`, `completeness_score`, `total_score`, and word-level errors.
   - Target latency: under 2 seconds.

2. GPT feedback
   - Input: target sentence, recognized text, and pronunciation scores.
   - Expected: Korean issue summary, 3 alternatives, and business importance note.
   - Target latency: under 3 seconds.

3. OpenAI TTS
   - Input: expression text and speed.
   - Expected: playable MP3 URL or data URL when Supabase is not configured.

4. Supabase TTS cache
   - Input: same expression text twice.
   - Expected: second call returns cached object URL without regenerating audio.

## Current Limitation

No Stage 4 AI service latency blocker remains from the latest local verification. Re-test after changing prompts, model names, API region, or network environment.

## Fix Applied

`backend/app/services/openai_tts.py` now returns a `data:audio/mpeg;base64,...` fallback if Supabase upload fails. This keeps local TTS playback usable if storage setup regresses. Coverage was added in `backend/tests/test_openai_tts.py`.
