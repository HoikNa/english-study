# SpeakReadyMY Backend

FastAPI scaffold for the API described in `docs/design/02-api-spec.md` and
`docs/design/04-backend-architecture.md`.

This stage uses a local SQLite repository and mock AI services so the Expo app
can exercise the real API contract before Supabase, Azure Speech, and OpenAI are
connected.

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
- Progress stats and weekly report mock
- SM-2 scheduler unit tests

## Local database

By default, the API creates and seeds this file on startup:

```bash
backend/.data/speakready.sqlite3
```

Override it with `DATABASE_URL=sqlite:///absolute/or/relative/path.sqlite3`.
The local backend currently supports SQLite URLs only.
