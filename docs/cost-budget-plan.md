# Cost Budget Plan

Date: 2026-05-26

## Budget Target

| Area | Target |
| --- | --- |
| Initial beta budget | Keep observed monthly paid service usage under USD 30. |
| Main cost drivers | Azure Speech pronunciation, OpenAI feedback, OpenAI TTS, Lambda duration, Secrets Manager. |
| Tracking source | `docs/cost-actual-log.md` plus provider billing dashboards. |

## Per-Flow Cost Controls

| Flow | Control | Status |
| --- | --- | --- |
| Pronunciation analysis | One Azure Speech call per submitted recording; short/quiet recordings are rejected before provider call where possible. | Implemented |
| GPT feedback | Uses `gpt-4.1-nano` for feedback to keep cost low. | Implemented |
| TTS playback | Generated audio is cached in Supabase Storage. | Implemented |
| Simulation | GPT call only after user sends a turn. | Implemented |
| Weekly report | Aggregates local session data before calling AI; current implementation is live-data based. | Partial |
| AI endpoint rate limit | API Gateway default throttling plus in-app limiter caps `/ai/*` requests per user/IP per configured window. | Implemented |

## Alert Thresholds

| Threshold | Action |
| --- | --- |
| USD 10 monthly observed | Review dashboard usage and compare with `cost-actual-log.md`. |
| USD 20 monthly observed | Disable nonessential AI experiments and reduce simulation usage. |
| USD 30 monthly observed | Stop public acquisition, inspect runaway flows, and enable cheaper/fallback model strategy before continuing. |

## Pending Work

| Status | Item |
| --- | --- |
| ☐ | Reconcile app-level call counts with OpenAI dashboard usage. |
| ☐ | Reconcile Azure Speech minutes with Azure Cost Management. |
| ✅ | Add CloudWatch alarm for Lambda error rate and duration spikes. |
| ◐ | Deploy and observe API Gateway throttling behavior under controlled load. Deployed values are burst 20 and rate 10 req/sec; controlled load test remains. |
| ◐ | Track Secrets Manager monthly cost after production rollout; currently one app secret is deployed. |
| ✅ | Implement or remove `GEMINI_FALLBACK_ENABLED`; removed on 2026-05-27 (descope, no Gemini SDK or fallback path was ever implemented; 1-user budget makes fallback trigger unnecessary). |
| ☐ | Add a monthly cost review routine before beta expansion. |

## Current Observed Baseline

The latest Android device pass confirmed the real learning flow with a small number of app-level paid calls. Exact provider billing numbers have not yet been reconciled, so this plan treats the current cost status as beta-safe for testing but not yet production-audited.
