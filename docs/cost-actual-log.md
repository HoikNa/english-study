# Cost Actual Log

Date: 2026-05-26

## Scope

Track actual usage after deployed API testing. Values here should be updated
after each real-device pass or small beta session.

## Current Deployment

| Service | Configuration |
| --- | --- |
| Backend | AWS Lambda Python 3.12, 512 MB |
| API | API Gateway HTTP API |
| Database | Supabase PostgreSQL pooler |
| Storage | Supabase Storage bucket `tts-cache` |
| Speech | Azure Speech, region `koreacentral` |
| GPT feedback | OpenAI `gpt-4.1-nano` |
| GPT general | OpenAI `gpt-4o` |
| TTS | OpenAI TTS voice `nova` |

## Latest Observed Run

| Item | Value |
| --- | --- |
| Test type | Android dev-client real-device E2E pass |
| API URL | `https://d6f9adjh85.execute-api.ap-northeast-2.amazonaws.com` |
| Result | Pass |
| Notes | User-confirmed pass after latest JS reload. Flow covered login, today's learning, TTS listen playback, real mic recording, Azure/GPT feedback, session save, next-expression navigation, review data, and bottom safe-area checks. |

## Per-Flow Usage Notes

| Step | Paid service touched | Current note |
| --- | --- | --- |
| Pronunciation assessment | Azure Speech | One call per recording analysis. |
| GPT feedback | OpenAI | One call per feedback screen. Latest deployed warm call was about 10.47s. |
| Session save | AWS Lambda, Supabase DB | Low-cost DB write. |
| Review enqueue | AWS Lambda, Supabase DB | Low-cost DB write. |
| TTS playback | OpenAI TTS, Supabase Storage | First generation costs; cached replay should hit Supabase URL. |

## Actual Usage Entries

| Date | Scenario | Users | Pronunciation calls | GPT feedback calls | TTS generations | TTS cache hits | Notes |
| --- | --- | ---: | ---: | ---: | ---: | ---: | --- |
| 2026-05-25 | Browser fake-mic E2E | 1 | 1 successful, 1 pre-layer 415 | 1 | 0 | 0 | ffmpeg layer fixed compressed audio upload. |
| 2026-05-26 | Android dev-client real mic E2E | 1 | 4 successful, several retried/failed attempts while tuning audio upload and Azure recognition | 2 | 1 | 1+ | Confirmed real mic, prosody, feedback save, review queue, and TTS listen playback. |
| 2026-05-26 | Android dev build v3 generation | 0 | 0 | 0 | 0 | 0 | Build-only event. APK `https://expo.dev/artifacts/eas/2EPw4kkypA1WhgwBuXtWe7.apk`; no app E2E calls counted yet. |
| 2026-05-26 | Android dev-client UI confirmation pass | 1 | 1+ observed app-level | 1+ observed app-level | 0-1 observed app-level | 0-1 observed app-level | User-confirmed full flow pass after JS UI fixes. Exact provider dashboard usage not reconciled yet. |
| 2026-05-26 | Android production AAB build | 0 | 0 | 0 | 0 | 0 | Build-only event. EAS production build `267f9b38-fb05-4c6b-8a29-8ebf5e7975b2`, AAB `https://expo.dev/artifacts/eas/5KJiwe5kxRDva79WykCfbE.aab`. |

## Watch Items

- GPT feedback latency and token usage after real-device testing.
- Azure Speech monthly minutes once real recordings begin.
- Lambda duration for pronunciation calls, especially cold starts.
- Supabase database row growth for `sessions`, `review_queue`, and `refresh_tokens`.
- TTS cache hit rate before adding more content.
- Re-check exact OpenAI/Azure dashboard usage before public beta; this log tracks observed app-level calls, not provider billing exports.
