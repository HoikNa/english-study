# API Latency Log

Test date: 2026-05-25

## Environment

| Item | Value |
| --- | --- |
| Backend | AWS Lambda + API Gateway + Supabase PostgreSQL |
| Frontend | Expo web dev server with `EXPO_PUBLIC_USE_MOCK=false` |
| API URL | `https://d6f9adjh85.execute-api.ap-northeast-2.amazonaws.com` |
| AI services | Azure/OpenAI/Supabase real keys configured |

## Measured Latencies

| Endpoint / Action | Result | Latency |
| --- | --- | ---: |
| Azure speech synthesis for test audio | Pass | 0.67s |
| Azure pronunciation assessment | Pass | 1.36s |
| GPT feedback before prompt tuning | Pass | 5.74s |
| GPT feedback after prompt tuning | Pass | 2.65s |
| GPT custom expression | Pass | 1.09s |
| GPT simulation | Pass | 1.39s |
| Supabase bucket creation | Pass | 0.06s |
| OpenAI TTS first call | Pass | 4.55s |
| OpenAI TTS second call from cache | Pass | 0.32s |
| Lambda cold start + pronunciation endpoint | Pass | 5.98s billed, 4.59s handler |
| GPT feedback endpoint on warm Lambda | Pass | 10.47s |
| Session save endpoint on warm Lambda | Pass | 0.13s |
| Review enqueue endpoint on warm Lambda | Pass | 0.25s |

## Weekly Report / App Flow

| Action | Result | Notes |
| --- | --- | --- |
| Weekly report API build | Pass | Aggregates session history and previous-week delta in `backend/app/services/weekly_report.py` |
| Weekly report screen export | Pass | `app/report/weekly.tsx` consumes live API data |
| Real API web export | Pass | `EXPO_PUBLIC_USE_MOCK=false EXPO_PUBLIC_API_URL=http://localhost:8000 npm run export:web` |
| Deployed API browser E2E | Pass | Register/home/shadowing/feedback/session/review completed against API Gateway |

## Interpretation

- Azure pronunciation is within the target budget.
- GPT feedback is now within the 3 second target after narrowing the prompt and switching to `gpt-4.1-nano`.
- TTS cache is working: first call is expensive, second call is fast and returns the same URL.
- Weekly report is computed locally from session history and no longer depends on a stubbed payload.
- Deployed pronunciation needs the ffmpeg Lambda layer for WebM/Opus uploads. Before the layer, `/ai/pronunciation` returned `415`; after the layer, it returned `200`.
- GPT feedback is the slowest deployed call in this browser fake-mic pass. Keep watching it after real-device runs before deciding whether to tune timeout/memory/model settings.
