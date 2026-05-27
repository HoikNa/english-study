# Integration Test Log

Test date: 2026-05-26

## Scope

Stage 5 integration readiness. This pass includes the real deployed API path
through AWS Lambda, API Gateway, Supabase PostgreSQL, Azure Speech, OpenAI, and
Supabase Storage.

## Environment

| Item | Value |
| --- | --- |
| Frontend | Expo SDK 56 web export |
| Backend | FastAPI on AWS Lambda + API Gateway |
| API mode | `EXPO_PUBLIC_USE_MOCK=false` with deployed API URL |
| API URL | `https://d6f9adjh85.execute-api.ap-northeast-2.amazonaws.com` |
| AI services | Azure/OpenAI/Supabase real calls verified in `docs/ai-service-test-log.md` |
| Deployment prep | PostgreSQL `DATABASE_URL` support, AWS SAM template, and ffmpeg Lambda layer added |
| Deployment preflight | AWS credentials pass; SAM CLI installed; Supabase pooler `DATABASE_URL` and production `JWT_SECRET` configured locally |
| Device runtime | Expo Go may be incompatible with SDK 56; project now includes `expo-dev-client` and `eas.json` for development builds |

## Results

| Flow | Status | Notes |
| --- | --- | --- |
| F-01 Onboarding/auth | Pass deployed | Browser E2E against API Gateway registered a new user with `201`, loaded `/auth/me` with `200`, and rendered the authenticated home screen. |
| F-02 Shadowing cycle | Pass deployed | Browser E2E with fake mic reached feedback. `/ai/pronunciation` returned `200` after ffmpeg layer deployment, `/ai/feedback` returned `200`, `/sessions` returned `201`, and the UI showed `저장됨`. Fake mic input produced a 0 score, which is expected. |
| F-02a Real Android shadowing cycle | Pass deployed | Real Android dev-client pass completed with microphone recording, Lambda ffmpeg conversion, Azure pronunciation/prosody scoring, GPT feedback, session save, and TTS playback. Prosody returned non-zero after enabling Azure prosody assessment. |
| F-03 Low-score review enqueue | Pass deployed | Low-score browser E2E called `/review/exp-011/enqueue` and received `201`. |
| F-03a Review loop UI | Pass local/export | Review screen now uses live review queue + latest session data, shows real score/date/focus point, plays TTS, and routes re-record to the shadowing screen. |
| F-04 Review update | Pass locally | Backend test covers SM-2 update and due queue behavior. |
| F-05 IT simulation | Pass locally | Real GPT simulation call passed in AI service log. The Expo web screen boots from `/ai/simulate/start`, enables the composer after text input, sends through `/ai/simulate/{id}/message`, and renders both the user's message and the AI reply. Backend logs returned `200` for start and message calls. |
| F-06 Custom expression add | Pass locally | Frontend now saves via `/expressions/custom`; backend create + soft delete path covered by tests. |
| F-07 Weekly report | Pass locally | Backend weekly report now aggregates session history; Expo screen consumes `/reports/weekly`. Live browser eval against the local backend returned `201` for register and `200` for `/reports/weekly`, and the Expo web UI rendered the live report on `localhost:8082`. The `진도` screen exposes the weekly report entry point and routes to `/report/weekly`. Full device E2E remains. |
| F-08 TTS cache | Pass locally | Supabase `tts-cache` bucket created; second call returned same URL in 0.32s. |
| F-09 Today expression recommendation | Pass deployed | `/expressions/today` now returns the first due review expression if available, otherwise an unpracticed expression. Deployed API check returned a different recommendation after saving a session for the first recommendation. |
| D-02 Android dev build v3 | Pass built | EAS development APK build `0d84afa2-5b3c-4ad9-b577-5fb74f231378` finished. APK: `https://expo.dev/artifacts/eas/2EPw4kkypA1WhgwBuXtWe7.apk`. |
| D-03 Android device E2E v3 | Pass device | User-confirmed pass on the installed Android development build after JS reload. Confirmed sign-in, today's learning entry, TTS listen playback, visible recording CTA, real mic analysis, feedback save, next-expression navigation, review recent data, and bottom safe-area spacing. |
| D-04 Android dev build v4 (Sentry native SDK) | Pass built | EAS development APK build `dc1cf650-05ef-40ae-8085-e3dc030784ff` finished with `@sentry/react-native` plugin configured for `korea-telecom/python-0k` and `SENTRY_AUTH_TOKEN` registered as EAS project secret. APK: `https://expo.dev/artifacts/eas/tbteihUzNkiGsA5q8iZsFH.apk`. |
| D-05 Device Sentry probe | Pass device | User installed the v4 APK, connected the dev-client to a Metro tunnel so `__DEV__` was true, and triggered Settings → `Sentry 테스트 전송`. The `captureMessage` call returned event id `89225eb4...`, confirming the native `@sentry/react-native` SDK is wired and reaches `korea-telecom/python-0k`. |
| D-01 Lambda deployment | Pass deployed | `sam validate`, `sam build`, and `sam deploy` succeeded for stack `speakready-my-backend` in `ap-northeast-2`. |

## Fixes Applied

- `app/custom/add.tsx`
  - The final "학습 큐에 추가" action now calls `/expressions/custom` in real API mode.
  - The selected converted English sentence is sent to the save endpoint, so the saved expression matches what the user selected.
  - Query caches for expressions/progress are invalidated after save.
  - API errors are shown instead of leaving the loading state stuck.

- `backend/app/services/repository.py`
  - Expression list/detail queries now hide soft-deleted expressions.
  - Added `delete_custom_expression()` with 404 for missing expressions and 403 for non-custom expressions.

- `backend/app/database.py`
  - Local SQLite schema now includes `expressions.is_deleted`.
  - Startup migration adds the column for existing local databases.

- `hooks/useAuthSession.ts`
  - Session validation failures now clear auth state instead of leaving an unhandled rejection.

- `backend/app/services/weekly_report.py`
  - Weekly report now derives metrics from session history and previous-week comparison.

- `app/report/weekly.tsx`
  - Weekly report screen now consumes live API data with loading/error states.

- `hooks/useAzurePronunciation.ts`
  - Direct feedback opens without a recording URI now use the local mock pronunciation result instead of sending a fake audio upload to Azure.

- `backend/app/services/azure_speech.py`
  - Mobile compressed audio is converted to mono 16 kHz WAV before Azure assessment.
  - Audio duration/volume guardrails now return actionable 422 errors before Azure calls.
  - Azure prosody assessment is enabled with `en-US` so the feedback screen receives non-zero prosody scores.

- `components/shadowing/RecordButton.tsx`
  - Recording is now a high-contrast full-width CTA with explicit start/stop text, elapsed time, and Android voice-recognition audio source.
  - The idle state now uses an inline dark blue background and the recording state uses dark red, avoiding the white-on-light appearance reported on device.

- `app/shadowing/[id].tsx`
  - TTS playback is exposed as a visible `듣기` button.
  - The recording panel respects bottom safe-area spacing on Android.

- `app/(tabs)/review.tsx`
  - Review cards now use live latest-session data instead of hardcoded `5일 전 학습`, `0:03`, and sample mistake text.
  - When the review queue is empty, the screen now shows the latest real session score/focus data and a re-record action instead of only a generic completion state.

- `app/feedback.tsx`
  - `다음 표현` now routes to the next expression in the same category instead of going back.
  - The next-expression button now waits for the full category expression list before allowing navigation, preventing accidental fallback to the category screen.
  - The retry action was removed from the fixed result dock, and a secondary `다음` / `목록` action was added to the result header so the next step remains visible on Android devices with crowded bottom navigation areas.
  - The fixed result dock now uses a dark panel and high-contrast blue next button, with the button color applied inline to avoid white/washed-out rendering on Android.

- `backend/app/routers/expressions.py`
  - Added authenticated `/expressions/today` recommendation endpoint for the home screen.

- `backend/app/routers/review.py`
  - Review enqueue accepts the actual session score; frontend now queues scores below 85 instead of always storing 55.

- `hooks/useSimulation.ts`
  - Simulation start/message API calls now live behind reusable React Query mutations.

- `app/simulate/[scenario].tsx`
  - Simulation screen now boots from the real backend and sends chat turns through `/ai/simulate/*`.
  - Composer send state is explicit: empty input stays disabled, pending sends show an in-chat loading bubble, send failures are shown inline, and retry for failed scenario start re-runs the start mutation.

- `backend/app/database.py`
  - Backend now supports `sqlite:///` for local development and `postgresql://` / `postgres://` for Supabase deployment.
  - Startup schema creation, seed data, and lightweight migrations now branch by database backend.
  - PostgreSQL startup initialization uses `pg_advisory_lock` to avoid cold-start seed deadlocks.

- `backend/template.yaml`
  - Added AWS SAM scaffold for Lambda + API Gateway deployment.
  - Runtime environment variables are parameterized for database, auth, AI keys, Supabase cache, CORS, and ffmpeg path.
  - Added `FfmpegLayer` so Lambda can convert WebM/Opus browser recordings before Azure pronunciation assessment.

- `backend/app/services/repository.py`
  - PostgreSQL expression queries now use boolean deletion checks instead of SQLite integer checks.

## Automated Checks

```text
npm run backend:test
Result: 31 passed

npm run typecheck
Result: passed

npm run export:web
Result: passed

npm run build:android:dev -- --non-interactive
Result: EAS Android development build finished, build version 3, APK `https://expo.dev/artifacts/eas/2EPw4kkypA1WhgwBuXtWe7.apk`

sam validate --template-file backend/template.yaml
Result: passed

sam build
Result: passed

sam deploy
Result: stack speakready-my-backend updated successfully

EXPO_PUBLIC_USE_MOCK=false EXPO_PUBLIC_API_URL=http://localhost:8000 npm run export:web
Result: passed

Expo web browser verification on `localhost:8083`
Result: `/simulate/iot-meeting` rendered the initial backend message, sent one user turn, rendered the AI reply, and backend logs showed `200 OK` for `/ai/simulate/start` and `/ai/simulate/{id}/message`.

Expo web browser verification on `localhost:8082` against deployed API
Result: register 201, home APIs 200, pronunciation 200, feedback 200, session save 201, review enqueue 201, UI displayed `저장됨`.

Deployed API smoke check on 2026-05-26
Result: `/health` returned `{"status":"ok"}`; temp user registration succeeded; authenticated `/api/v1/expressions/today` returned `exp-001`.

Android dev-client device E2E on 2026-05-26
Result: user-confirmed pass after reloading the latest JS bundle. Core flow passed from login through today's learning, listen playback, recording, Azure/GPT feedback, session save, visible next-expression button, next-expression navigation, review data, and bottom spacing.

Operations deploy on 2026-05-26
Result: `sam build` and `sam deploy` updated stack `speakready-my-backend`. Deployed API `/health` returned `{"status":"ok"}`. API Gateway `$default` stage throttle is burst `20` / rate `10.0`, and CloudWatch Lambda `Errors` plus `Duration` alarms are in `OK` state.

Alarm email deploy on 2026-05-26
Result: `sam deploy` added SNS topic `speakready-my-backend-alarms`, set both CloudWatch alarms to publish to the topic, and created the `bizhoik@gmail.com` email subscription. Subscription is confirmed.

Secrets Manager deploy on 2026-05-26
Result: `sam deploy` created Secrets Manager secret `speakready-my-backend/app`, gave the Lambda permission to read it, and changed the Lambda env to use `APP_SECRET_ID` instead of raw secret values. `/health` returned `{"status":"ok"}` and a deployed auth register/me smoke test passed.

Account deletion API local test on 2026-05-26
Result: `npm run backend:test` passed with 36 tests and 73.12% coverage. The new test confirms `DELETE /api/v1/auth/me` removes the user, sessions, review queue, refresh tokens, and causes old access/refresh tokens to return `401`.

Account export API local test on 2026-05-26
Result: `npm run backend:test` passed with 37 tests and 73.42% coverage. The new test confirms `GET /api/v1/auth/me/export` returns the authenticated user's profile, sessions, and review queue data.

Account deletion API deploy smoke on 2026-05-26
Result: `sam deploy` updated the Lambda. A temporary deployed user returned `200` from `/auth/me`, `204` from `DELETE /auth/me`, then `401` for both old access-token `/auth/me` and old refresh-token `/auth/refresh`.

Account export/delete deploy smoke on 2026-05-26
Result: `sam deploy` updated the Lambda. A temporary deployed flow returned `201` for register, `201` for session save, `201` for review enqueue, `200` for `/auth/me/export` with 1 session and 1 review item, `204` for `DELETE /auth/me`, then `401` for old access and refresh tokens.

Settings account controls local build check on 2026-05-26
Result: `app/settings.tsx` exposes data export through the native share sheet and account deletion behind a destructive confirmation dialog. `npm run typecheck` and `npm run export:web` passed.

Backend Sentry deploy on 2026-05-26
Result: Added optional `sentry-sdk` initialization with `send_default_pii=false`, `SENTRY_DSN` loaded from Secrets Manager, and `SENTRY_TRACES_SAMPLE_RATE=0.05` in Lambda env. `npm run backend:test` passed with 39 tests and 73.39% coverage. `sam validate --lint`, `sam build`, and `sam deploy` passed. Deployed `/health` returned `{"status":"ok"}`. The deployed secret has a `SENTRY_DSN` key but no value, so backend Sentry remains disabled until a DSN is provided.

Backend Sentry DSN activation on 2026-05-26
Result: `sam deploy` updated the Secrets Manager value for `SENTRY_DSN`. Deployed `/health` returned `{"status":"ok"}` and Secrets Manager verification confirmed the `SENTRY_DSN` key is present and set without printing the value.

Backend Sentry probe on 2026-05-26
Result: Added a token-protected `/api/v1/ops/sentry-test` probe endpoint and deployed it with a temporary probe token. Deployed `/health` returned `{"status":"ok"}`. Calling the probe returned `{"status":"sent"}` with event id `69cbc032acc64cd8b395e6d1430d9ca7`, confirming the backend can submit Sentry events.

EAS production Android build on 2026-05-26
Result: production profile build `267f9b38-fb05-4c6b-8a29-8ebf5e7975b2` finished. Distribution is `STORE`, app version is `1.0.0`, build version is `4`, and AAB artifact is `https://expo.dev/artifacts/eas/5KJiwe5kxRDva79WykCfbE.aab`.
```

## Remaining Stage 5 Work

- Add the exact hosted Expo web origin to `CORS_ALLOW_ORIGINS` before public web hosting.
- Create another fresh Android development build only if native dependencies or Android app config change again.
- Re-check provider billing dashboards before public beta; local logs track observed app-level calls, not exact provider invoice totals.
