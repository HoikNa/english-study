# Deployment Runbook

Date: 2026-05-25

## Backend Target

- Runtime: AWS Lambda Python 3.12
- Entry point: `backend/handler.py`
- API front door: API Gateway HTTP API
- Template: `backend/template.yaml`
- Database: Supabase/PostgreSQL via `DATABASE_URL`

## Required Values

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | `postgresql://` or `postgres://` Supabase connection string |
| `JWT_SECRET` | Production-only random secret |
| `AZURE_SPEECH_KEY` | Required for real pronunciation scoring |
| `AZURE_SPEECH_REGION` | Defaults to `eastus` |
| `OPENAI_API_KEY` | Required for GPT feedback, simulation, and TTS |
| `SUPABASE_URL` | Required for TTS cache |
| `SUPABASE_SERVICE_KEY` | Required for TTS cache writes |
| `CORS_ALLOW_ORIGINS` | Comma-separated web origins; native apps do not rely on browser CORS |
| `APP_SECRET_ID` | Runtime-only Lambda environment value pointing to the Secrets Manager secret; created by the SAM stack in production |
| `ALARM_EMAIL` | Optional email address for CloudWatch alarm SNS notifications |
| `AI_RATE_LIMIT_WINDOW_SECONDS` | Optional AI endpoint rate-limit window; defaults to 60 |
| `AI_RATE_LIMIT_MAX_REQUESTS` | Optional max AI endpoint requests per user/IP per window; defaults to 30 |
| `API_THROTTLE_BURST_LIMIT` | Optional API Gateway HTTP API burst throttle; defaults to 20 |
| `API_THROTTLE_RATE_LIMIT` | Optional API Gateway HTTP API steady requests per second; defaults to 10 |
| `SENTRY_DSN` | Optional Sentry project DSN; stored in Secrets Manager through the SAM stack |
| `SENTRY_TRACES_SAMPLE_RATE` | Optional backend Sentry trace sample rate; defaults to 0.05 |
| `SENTRY_TEST_TOKEN` | Optional token for the controlled `/api/v1/ops/sentry-test` probe endpoint |

## Current Local Preflight

| Check | Status | Notes |
| --- | --- | --- |
| AWS CLI credentials | Pass | `aws sts get-caller-identity` succeeded for the local profile. |
| SAM CLI | Pass | `sam --version` returned `SAM CLI, version 1.161.0`. |
| `DATABASE_URL` | Pass | Supabase PostgreSQL pooler URL is configured locally. Use the transaction pooler host and port `6543`; direct `db.<ref>.supabase.co:5432` may fail from WSL/Lambda networking. |
| `JWT_SECRET` | Pass | Local deployment env uses a generated non-default secret. |
| Azure/OpenAI/Supabase service keys | Present locally | Values were checked by presence only; secrets are not recorded here. |
| Supabase DB connection | Pass | `SELECT 1` through the pooler succeeded. Startup schema/seed check returned 5 expressions and 1 seed user. |

## Build ffmpeg Lambda Layer

The browser and mobile clients can upload compressed audio such as WebM/Opus.
Lambda needs `ffmpeg` at `/opt/bin/ffmpeg` so the backend can convert that audio
to mono 16 kHz WAV before Azure pronunciation assessment.

Create the local layer artifact before `sam build`:

```bash
mkdir -p .lambda-layers/ffmpeg/bin /tmp/english-study-ffmpeg
curl -L https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz \
  -o /tmp/english-study-ffmpeg/ffmpeg-release-amd64-static.tar.xz
tar -xf /tmp/english-study-ffmpeg/ffmpeg-release-amd64-static.tar.xz \
  -C /tmp/english-study-ffmpeg
cp /tmp/english-study-ffmpeg/ffmpeg-*-amd64-static/ffmpeg \
  .lambda-layers/ffmpeg/bin/ffmpeg
chmod 755 .lambda-layers/ffmpeg/bin/ffmpeg
```

`.lambda-layers/` is intentionally gitignored because it contains generated
binary artifacts. `backend/template.yaml` attaches this directory as the
`FfmpegLayer` resource.

## Deploy

```bash
cd backend
sam build
sam deploy \
  --stack-name speakready-my-backend \
  --resolve-s3 \
  --capabilities CAPABILITY_IAM \
  --region ap-northeast-2 \
  --no-confirm-changeset \
  --no-fail-on-empty-changeset \
  --parameter-overrides \
  DatabaseUrl="$DATABASE_URL" \
  JwtSecret="$JWT_SECRET" \
  AzureSpeechKey="$AZURE_SPEECH_KEY" \
  AzureSpeechRegion="$AZURE_SPEECH_REGION" \
  OpenAiApiKey="$OPENAI_API_KEY" \
  SupabaseUrl="$SUPABASE_URL" \
  SupabaseServiceKey="$SUPABASE_SERVICE_KEY" \
  CorsAllowOrigins="$CORS_ALLOW_ORIGINS" \
  AiRateLimitWindowSeconds="${AI_RATE_LIMIT_WINDOW_SECONDS:-60}" \
  AiRateLimitMaxRequests="${AI_RATE_LIMIT_MAX_REQUESTS:-30}" \
  ApiThrottleBurstLimit="${API_THROTTLE_BURST_LIMIT:-20}" \
  ApiThrottleRateLimit="${API_THROTTLE_RATE_LIMIT:-10}" \
  SentryTracesSampleRate="${SENTRY_TRACES_SAMPLE_RATE:-0.05}" \
  AlarmEmail="$ALARM_EMAIL"
```

If `SENTRY_DSN` is set, add `SentryDsn="$SENTRY_DSN"` to `--parameter-overrides`.
Leave it out when the DSN is empty; the SAM template default keeps monitoring disabled.
If a controlled Sentry probe is needed, add `SentryTestToken="$SENTRY_TEST_TOKEN"` and call `/api/v1/ops/sentry-test` with the `X-Sentry-Test-Token` header.

Current deployed stack:

```text
Stack: speakready-my-backend
Region: ap-northeast-2
ApiUrl: https://d6f9adjh85.execute-api.ap-northeast-2.amazonaws.com
Default API throttle: burst 20, rate 10 req/sec
CloudWatch alarms: Lambda Errors, Lambda Duration
```

## After Deploy

1. Copy the `ApiUrl` stack output.
2. Run the Expo app with `EXPO_PUBLIC_USE_MOCK=false`.
3. Set `EXPO_PUBLIC_API_URL` to the deployed API URL.
4. Hit `/health`, then repeat the Stage 5 flows from `docs/integration-test-log.md`.
5. Record deployed timings in `docs/api-latency-log.md`.
6. Record API usage/cost observations in `docs/cost-actual-log.md`.
7. For account data smoke checks, register a temporary user, call `GET /api/v1/auth/me/export`, then call `DELETE /api/v1/auth/me` with its access token, and confirm old access/refresh tokens return `401`.

## Known Deployment Notes

- The backend accepts PostgreSQL URLs for deployment and SQLite URLs for local tests/development.
- PostgreSQL startup initialization uses an advisory lock to avoid concurrent cold-start seed deadlocks.
- Compressed browser/mobile audio is supported after attaching the ffmpeg Lambda layer and keeping `FfmpegBinary=/opt/bin/ffmpeg`.
- If the Expo web build is hosted on an HTTPS domain, add that exact origin to `CORS_ALLOW_ORIGINS`.
- If `ALARM_EMAIL` is provided, the stack creates an SNS topic plus CloudWatch alarms for Lambda `Errors` and high average `Duration`. Confirm the SNS email subscription after deploy.
- API Gateway default route throttling is configured through `DefaultRouteSettings`.
- AI endpoints also include an in-app per-user/IP rate limiter. It is a Lambda-instance guardrail layered behind API Gateway throttling.
- Backend Sentry initializes only when `SENTRY_DSN` is set. The DSN is stored in Secrets Manager; Lambda environment variables should expose only `SENTRY_TRACES_SAMPLE_RATE`.
- The `/api/v1/ops/sentry-test` endpoint is hidden unless `SENTRY_TEST_TOKEN` is set and requires the matching `X-Sentry-Test-Token` header.
- `GET /api/v1/auth/me/export` returns account-scoped backend data: user profile, sessions, and review queue.
- `DELETE /api/v1/auth/me` removes account-scoped backend data: user row, sessions, review queue, and refresh tokens.
- The 2026-05-26 operations deploy created/updated the CloudWatch alarms and API Gateway stage throttle. A later redeploy set `AlarmEmail=bizhoik@gmail.com`; the SNS email subscription is confirmed.
- The 2026-05-26 Secrets Manager deploy created secret `speakready-my-backend/app`, removed raw DB/JWT/Azure/OpenAI/Supabase secrets from Lambda environment variables, and verified runtime auth through `/auth/register` plus `/auth/me`.
- The 2026-05-26 backend Sentry deploy added `SENTRY_DSN` to the secret JSON and `SENTRY_TRACES_SAMPLE_RATE` to Lambda env. A follow-up deploy set `SENTRY_DSN` in Secrets Manager, so backend Sentry is active.
