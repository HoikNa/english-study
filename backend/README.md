# SpeakReadyMY Backend

FastAPI scaffold for the API described in `docs/design/02-api-spec.md` and
`docs/design/04-backend-architecture.md`.

This stage uses SQLite for local development and can use PostgreSQL/Supabase in
deployment. AI services fall back to mock responses when keys are not configured.

## Run locally

```bash
cd backend
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

Then set the Expo app to API mode:

```bash
EXPO_PUBLIC_USE_MOCK=false
EXPO_PUBLIC_API_URL=http://localhost:8000
```

## Current scope

- Expressions list/detail
- Mock pronunciation, GPT feedback, TTS URL, custom expression, simulation
- Session create/list persisted to SQLite
- Review queue today/enqueue/update persisted to SQLite
- Progress stats and weekly report aggregation from session history
- SM-2 scheduler unit tests

## Local database

By default, the API creates and seeds this file on startup:

```bash
backend/.data/speakready.sqlite3
```

Override it with `DATABASE_URL=sqlite:///absolute/or/relative/path.sqlite3`.
For deployment, set `DATABASE_URL` to a PostgreSQL-compatible Supabase pooler
connection string. Prefer the transaction pooler for Lambda/serverless:

```bash
DATABASE_URL=postgres://postgres.<project-ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
```

The app creates its required tables and seed expressions on startup.

## Lambda deployment scaffold

`backend/template.yaml` defines the FastAPI Lambda, API Gateway HTTP API, and
runtime environment variables for AWS SAM. It also attaches an ffmpeg Lambda
layer at `/opt/bin/ffmpeg` for compressed audio conversion before Azure
pronunciation assessment.

Create the local ffmpeg layer artifact before building:

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

Minimal package/deploy flow:

```bash
cd backend
sam build
sam deploy --guided \
  --parameter-overrides \
  DatabaseUrl="$DATABASE_URL" \
  JwtSecret="$JWT_SECRET" \
  AzureSpeechKey="$AZURE_SPEECH_KEY" \
  OpenAiApiKey="$OPENAI_API_KEY" \
  SupabaseUrl="$SUPABASE_URL" \
  SupabaseServiceKey="$SUPABASE_SERVICE_KEY"
```

Current deployed stack output:

```bash
https://d6f9adjh85.execute-api.ap-northeast-2.amazonaws.com
```
