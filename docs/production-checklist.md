# Production Checklist

Date: 2026-05-26

## Stage 6 Entry

| Gate | Status | Evidence |
| --- | --- | --- |
| Stage 5 E2E pass | Pass | `docs/integration-test-log.md` records Android dev-client device E2E v3 as pass. |
| Real API mode | Pass | `.env` uses `EXPO_PUBLIC_USE_MOCK=false` and the deployed API Gateway URL. |
| Backend deployment | Pass | SAM stack `speakready-my-backend` is deployed in `ap-northeast-2`. |
| Android dev build | Pass | EAS development build v3 installed and tested on device. |
| Cost sanity | Partial | App-level usage is logged in `docs/cost-actual-log.md`; provider billing dashboards still need reconciliation. For personal side-load this is a soft requirement — track monthly using the Quick Links in `docs/incident-response.md`. |
| Sentry/monitoring | Pass | Backend Sentry integration is deployed and `SENTRY_DSN` is set in Secrets Manager. Frontend native SDK is bundled in dev build v4 (`dc1cf650-05ef-40ae-8085-e3dc030784ff`); device probe returned event id `89225eb4...` from Settings → `Sentry 테스트 전송`. |

## Required Before Public Beta

| Status | Item | Verification |
| --- | --- | --- |
| ⊘ | Add production web/native origins to `CORS_ALLOW_ORIGINS` | Deferred. Deployment mode is personal side-load only; no public web hosting is planned. Current defaults match the app scheme `speakready://` which is sufficient. Revisit if a web build is ever hosted. |
| ✅ | Configure CloudWatch alarms for Lambda errors and latency | Deployed Lambda `Errors` and high `Duration` alarms. Both are `OK`; SNS email subscription for `bizhoik@gmail.com` is confirmed. |
| ☐ | Reconcile OpenAI/Azure/Supabase/AWS dashboard usage | Update `docs/cost-actual-log.md` with provider dashboard numbers. |
| ✅ | Move API keys and JWT secret to AWS Secrets Manager | Lambda env now stores only `APP_SECRET_ID`; raw DB/JWT/Azure/OpenAI/Supabase secrets were removed from Lambda env and auth smoke test passed. |
| ✅ | Add CI checks for frontend and backend | `.github/workflows/frontend.yml` and `.github/workflows/backend.yml` confirmed green on PR #3 (2026-05-27). |
| ✅ | Add backend coverage threshold | `pytest.ini` enforces `--cov=backend/app --cov-fail-under=50`; GitHub `Pytest with coverage` job confirmed green on PR #3 (2026-05-27). |
| ⊘ | Decide production build profile and app identifiers | Deferred for store metadata/assets review. Deployment mode is personal side-load only — no Play Store submission planned. Android package `com.hoik.speakreadymy`, iOS bundle id `com.hoik.speakreadymy`, AAB profile with auto-incrementing `versionCode` are already set, so the profile itself is production-ready if a submission ever happens. |
| ✅ | Run EAS production build dry run | Android production AAB build `267f9b38-fb05-4c6b-8a29-8ebf5e7975b2` finished with app build version `4`. |
| ⊘ | Prepare store privacy disclosures | Deferred. Personal side-load only — no Play Store privacy URL requirement. Draft `docs/privacy-policy-draft.md` remains in repo for future reference. |

## Nice Before Beta

| Status | Item | Notes |
| --- | --- | --- |
| ✅ | Add Sentry or equivalent client/backend error reporting | Backend Sentry integration is active through Secrets Manager. Frontend `@sentry/react-native` plugin is configured for `korea-telecom/python-0k`, `SENTRY_AUTH_TOKEN` is registered as an EAS project secret for sourcemap upload, and dev build v4 bundles the native SDK. Device probe via Settings → `Sentry 테스트 전송` returned event id `89225eb4...`. |
| ✅ | Add API throttling or rate limits for AI endpoints | API Gateway default route throttling is deployed and verified; in-app `/ai/*` limiter is also enabled. |
| ✅ | Add account deletion/export path | `GET /api/v1/auth/me/export` exports account-scoped learning data. `DELETE /api/v1/auth/me` deletes the authenticated account, sessions, review queue, and refresh tokens. |
| ✅ | Add a simple status page or runbook link | `docs/incident-response.md` now contains a `Quick Links` block at the top with API health, CloudWatch logs/alarms, Secrets Manager, API Gateway, Sentry, Supabase, Azure, OpenAI, and EAS dashboards. |

## Current Decision

Deployment mode is **personal side-load only** (single user, HOIK; no Play Store submission, no public web hosting planned). Under that mode, Stage 6 is effectively complete: monitoring, CI, secrets, throttling, account export/delete, Sentry frontend+backend, CloudWatch alarms, and an incident runbook with Quick Links are all in place. The remaining `Cost sanity` row is a soft tracking item rather than a release blocker — reconcile when the monthly observed usage approaches the USD 10 alert threshold in `docs/cost-budget-plan.md`. CORS, store metadata, and a hosted privacy URL are marked `⊘ Deferred` and should be revisited only if the deployment mode changes (public web hosting or store submission).

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

## 2026-05-27 Progress

| Item | Result |
| --- | --- |
| Frontend Sentry native SDK wiring | Replaced the bare `@sentry/react-native` Expo plugin with `{ organization: "korea-telecom", project: "python-0k" }` so EAS builds can upload sourcemaps. `SENTRY_AUTH_TOKEN` was registered via `eas secret:create` (project scope). `npm run typecheck` passed. |
| Android dev build v4 | Triggered EAS development build `dc1cf650-05ef-40ae-8085-e3dc030784ff` against commit `078377d`. Build finished in ~16 min. APK: `https://expo.dev/artifacts/eas/tbteihUzNkiGsA5q8iZsFH.apk`. |
| Frontend Sentry device probe | User installed the v4 APK, connected the dev-client to a Metro tunnel (`exp://hfxn3bw-hoik-8081.exp.direct`) so `__DEV__=true`, and triggered Settings → `Sentry 테스트 전송`. The probe returned event id `89225eb4...`, confirming the native SDK is wired end-to-end to `korea-telecom/python-0k`. Local `.env` now includes `EXPO_PUBLIC_SENTRY_DSN` so Metro-served builds keep Sentry ON. |
| Incident runbook Quick Links | Added a `Quick Links` block at the top of `docs/incident-response.md` covering API health, CloudWatch logs/alarms, Secrets Manager, API Gateway, Sentry backend/frontend projects, Supabase, Azure Speech, OpenAI usage, EAS builds, the deployment runbook, and the budget/actual cost logs. |
| Stage 6 scope decision | Confirmed deployment mode as personal side-load only. Marked CORS production origins, store metadata/identifiers, and hosted store privacy disclosures as `⊘ Deferred`. Cost reconciliation is left as a soft monthly tracking item against the USD 10 alert threshold in `docs/cost-budget-plan.md`. |
