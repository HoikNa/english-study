# Production Checklist

Date: 2026-05-26

## Stage 6 Entry

| Gate | Status | Evidence |
| --- | --- | --- |
| Stage 5 E2E pass | Pass | `docs/integration-test-log.md` records Android dev-client device E2E v3 as pass. |
| Real API mode | Pass | `.env` uses `EXPO_PUBLIC_USE_MOCK=false` and the deployed API Gateway URL. |
| Backend deployment | Pass | SAM stack `speakready-my-backend` is deployed in `ap-northeast-2`. |
| Android dev build | Pass | EAS development build v3 installed and tested on device. |
| Cost sanity | Partial | App-level usage is logged in `docs/cost-actual-log.md`; provider billing dashboards still need reconciliation. |
| Sentry/monitoring | Partial | Backend Sentry integration is deployed and `SENTRY_DSN` is set in Secrets Manager. Frontend Sentry still needs a native SDK build. |

## Required Before Public Beta

| Status | Item | Verification |
| --- | --- | --- |
| ◐ | Add production web/native origins to `CORS_ALLOW_ORIGINS` | Defaults now match the app scheme `speakready://`. Add the exact hosted web origin before public web hosting, then redeploy backend and verify auth. |
| ✅ | Configure CloudWatch alarms for Lambda errors and latency | Deployed Lambda `Errors` and high `Duration` alarms. Both are `OK`; SNS email subscription for `bizhoik@gmail.com` is confirmed. |
| ☐ | Reconcile OpenAI/Azure/Supabase/AWS dashboard usage | Update `docs/cost-actual-log.md` with provider dashboard numbers. |
| ✅ | Move API keys and JWT secret to AWS Secrets Manager | Lambda env now stores only `APP_SECRET_ID`; raw DB/JWT/Azure/OpenAI/Supabase secrets were removed from Lambda env and auth smoke test passed. |
| ◐ | Add CI checks for frontend and backend | `.github/workflows/frontend.yml` and `.github/workflows/backend.yml` added. First GitHub run still needs confirmation. |
| ◐ | Add backend coverage threshold | `pytest.ini` enforces `--cov=backend/app --cov-fail-under=50`; local run passed at 73.02%, first GitHub run still needs confirmation. |
| ◐ | Decide production build profile and app identifiers | Android package and iOS bundle ID are `com.hoik.speakreadymy`; production Android profile now emits an AAB and auto-increments `versionCode`. Final store metadata/assets still need review. |
| ✅ | Run EAS production build dry run | Android production AAB build `267f9b38-fb05-4c6b-8a29-8ebf5e7975b2` finished with app build version `4`. |
| ◐ | Prepare store privacy disclosures | Draft privacy policy and app-store metadata are prepared; hosted public privacy URL and final review remain. |

## Nice Before Beta

| Status | Item | Notes |
| --- | --- | --- |
| ◐ | Add Sentry or equivalent client/backend error reporting | Backend Sentry integration is active through Secrets Manager. Frontend client reporting still needs native SDK wiring and a new build. |
| ✅ | Add API throttling or rate limits for AI endpoints | API Gateway default route throttling is deployed and verified; in-app `/ai/*` limiter is also enabled. |
| ✅ | Add account deletion/export path | `GET /api/v1/auth/me/export` exports account-scoped learning data. `DELETE /api/v1/auth/me` deletes the authenticated account, sessions, review queue, and refresh tokens. |
| ☐ | Add a simple status page or runbook link | Reference `docs/incident-response.md`. |

## Current Decision

The app is ready to leave Stage 5 integration and enter Stage 6 production-readiness work. It is not ready for a public beta until monitoring, CORS, CI, cost reconciliation, and production build settings are complete.

## 2026-05-26 Progress

| Item | Result |
| --- | --- |
| Stage 6 docs | Added `production-checklist.md`, `incident-response.md`, `cost-budget-plan.md`, and `app-store-metadata.md`. |
| Frontend CI | Added `.github/workflows/frontend.yml` for `npm ci`, `npm run typecheck`, and `npm run export:web`. |
| Backend CI | Added `.github/workflows/backend.yml` for Python 3.12 dependency install and `pytest`. |
| Local frontend verification | `npm run typecheck` and `npm run export:web` passed. |
| Local backend verification | `npm run backend:test` passed with 31 tests. |
| CloudWatch alarm IaC | Added optional SNS email, Lambda `Errors` alarm, and Lambda high `Duration` alarm to `backend/template.yaml`; `sam validate` and `sam validate --lint` passed. |
| Production build config | Added `ios.bundleIdentifier`, explicit Android production `app-bundle`, and production `versionCode` auto-increment. CORS examples now match the `speakready` scheme. |
| Backend coverage threshold | Added `pytest-cov`, enforced 50% threshold in `pytest.ini`, and confirmed `npm run backend:test` passes with 73.02% coverage. |
| AI endpoint rate limiter | Added per-user/IP in-memory limiter for `/ai/*`, SAM/env configuration, and tests. `npm run backend:test` passed with 34 tests and 72.58% coverage. |
| API Gateway throttling | Added `DefaultRouteSettings` throttle parameters to the HTTP API SAM resource; `sam validate --lint` passed. |
| Operations deploy | Ran `sam build` and `sam deploy` for stack `speakready-my-backend`. `/health` returned `{"status":"ok"}`. API Gateway `$default` stage shows burst `20` and rate `10.0`. CloudWatch `Errors` and `Duration` alarms are `OK`. SNS email subscription is confirmed. |
| Secrets Manager migration | Added `AWS::SecretsManager::Secret`, Lambda `secretsmanager:GetSecretValue` permission, and runtime secret loading via `APP_SECRET_ID`. Deployed and verified `/health`, Lambda env key list, and auth register/me smoke flow. |
| EAS production Android build | Production profile generated Store AAB `https://expo.dev/artifacts/eas/5KJiwe5kxRDva79WykCfbE.aab`; EAS build status `FINISHED`, app version `1.0.0`, build version `4`. |
| Store privacy draft | Added `docs/privacy-policy-draft.md` covering account, microphone, AI processing, learning history, providers, and deletion expectations. |
| Account deletion/export API | Added authenticated `GET /api/v1/auth/me/export` and `DELETE /api/v1/auth/me`; local tests confirm export returns account-scoped sessions/review queue and delete removes account, sessions, review queue, and refresh tokens. Deployed smoke test passed: register/session/review/export/delete returned `201/201/201/200/204`, export returned `1` session and `1` review item, then old access/refresh tokens returned `401`. Settings screen now exposes export and account deletion actions. |
| Backend Sentry integration | Added optional `sentry-sdk` initialization with `send_default_pii=false`, `SENTRY_DSN` loaded from Secrets Manager, and `SENTRY_TRACES_SAMPLE_RATE=0.05`. `npm run backend:test` passed with 39 tests and 73.39% coverage; `sam validate --lint`, `sam build`, and `sam deploy` passed. Deployed `/health` returned `{"status":"ok"}`. A follow-up `sam deploy` set `SENTRY_DSN`; Secrets Manager confirms the key is present and set. |
| Backend Sentry probe | Added token-protected `/api/v1/ops/sentry-test`, deployed it, and confirmed a probe event submission. The endpoint returned event id `69cbc032acc64cd8b395e6d1430d9ca7`. |
