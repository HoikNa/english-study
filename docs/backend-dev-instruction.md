# SpeakReadyMY Backend Development Instruction

이 문서는 현재 FastAPI 백엔드의 로컬 개발 규칙과 API/AI 서비스 연동 패턴을 정리한다.

## 실행 환경

- Python 의존성은 `backend/requirements.txt` 기준으로 설치한다.
- 로컬 실행 명령:

```bash
npm run backend:dev
```

- 테스트 명령:

```bash
npm run backend:test
```

- OpenAPI 산출물 갱신:

```bash
PYTHONPATH=backend backend/.venv/bin/python -c 'import json; from app.main import app; open("docs/openapi.json", "w", encoding="utf-8").write(json.dumps(app.openapi(), ensure_ascii=False, indent=2) + "\n")'
```

## 환경변수

`backend/app/config.py`의 `Settings`가 단일 진입점이다. 환경변수는 `.env` 또는 실행 환경 변수로 주입한다.

| 변수 | 기본값 | 용도 |
| --- | --- | --- |
| `DATABASE_URL` | `sqlite:///./backend/.data/speakready.sqlite3` | 로컬 SQLite 경로 또는 배포용 PostgreSQL/Supabase URL |
| `JWT_SECRET` | `dev-secret` | 액세스/리프레시 토큰 서명 |
| `JWT_EXPIRE_MINUTES` | `1440` | 액세스 토큰 만료 |
| `JWT_REFRESH_EXPIRE_MINUTES` | `43200` | 리프레시 토큰 만료 |
| `CORS_ALLOW_ORIGINS` | `exp://localhost:8081,speakready://` | 쉼표로 구분한 허용 Origin |
| `AI_RATE_LIMIT_WINDOW_SECONDS` | `60` | AI 엔드포인트 호출 제한 윈도우 |
| `AI_RATE_LIMIT_MAX_REQUESTS` | `30` | 사용자/IP별 윈도우당 AI 엔드포인트 최대 호출 수 |
| `AZURE_SPEECH_KEY` | 없음 | Azure 발음 평가 실제 호출 |
| `AZURE_SPEECH_REGION` | `eastus` | Azure Speech 리전 |
| `OPENAI_API_KEY` | 없음 | GPT 피드백, 시뮬레이션, TTS 실제 호출 |
| `OPENAI_GPT_MODEL` | `gpt-4o` | 커스텀 표현, 시뮬레이션 기본 GPT 모델 |
| `OPENAI_FEEDBACK_MODEL` | `gpt-4.1-nano` | 저지연 교정 피드백 모델 |
| `OPENAI_TTS_VOICE` | `nova` | TTS 음성 |
| `SUPABASE_URL` | 없음 | TTS 캐시 스토리지 |
| `SUPABASE_SERVICE_KEY` | 없음 | Supabase Storage 서비스 키 |
| `SUPABASE_STORAGE_BUCKET` | `tts-cache` | TTS 캐시 버킷 |

로컬 기본값은 개발 편의를 위한 값이다. 공유/배포 환경에서는 반드시 `JWT_SECRET`을 교체한다.

## 데이터베이스 패턴

- 연결과 초기화는 `backend/app/database.py`가 담당한다.
- 로컬 개발은 `sqlite:///` URL을 사용한다.
- 배포 환경은 `postgresql://` 또는 `postgres://` URL을 사용한다. Supabase 연결 문자열은 이 경로로 주입한다.
- 앱 시작 시 `initialize_database()`가 테이블 생성, 간단한 마이그레이션, mock seed 삽입을 수행한다.
- repository 함수는 `backend/app/services/repository.py`에 모아 둔다.
- 라우터에서 SQL을 직접 작성하지 말고 repository 함수를 추가해 사용한다.
- 사용자별 데이터는 `user_id`로 분리한다. 기존 개발 seed 사용자는 `dev-user`다.

## 인증 패턴

- 로그인/회원가입/토큰 갱신은 `backend/app/routers/auth.py`에서 처리한다.
- 보호 API는 `CurrentUser = Depends(get_current_user)`를 사용한다.
- 리프레시 토큰은 원문 저장 없이 `hash_token()` 결과만 `refresh_tokens` 테이블에 저장한다.
- 리프레시 토큰 재사용이 감지되면 해당 사용자의 리프레시 토큰을 모두 revoke한다.

## AI 서비스 패턴

- Azure 발음 평가: `backend/app/services/azure_speech.py`
- GPT 피드백/커스텀 표현/시뮬레이션: `backend/app/services/gpt_coach.py`
- OpenAI TTS 및 Supabase 캐시: `backend/app/services/openai_tts.py`

API 키가 없을 때는 프론트 통합 개발을 위해 mock 응답을 반환한다. 실제 API 호출 검증은 키를 설정한 환경에서 별도 로그 문서에 남긴다.

## 라우터 추가 규칙

- 라우터는 `backend/app/routers/`에 두고 `backend/app/main.py`에서 `/api/v1` prefix로 include한다.
- 요청/응답 모델은 `backend/app/schemas.py`에 정의한다.
- 상태 변경 API는 테스트를 추가한다. 저장소 동작은 `backend/tests/test_repository_persistence.py`, 인증 동작은 `backend/tests/test_auth_flow.py` 패턴을 따른다.
- 프론트가 소비하는 응답 필드는 `types/index.ts`와 `lib/api.ts`의 타입/클라이언트 계약도 함께 확인한다.

## Lambda 배포 준비

- Lambda 진입점은 `backend/handler.py`의 `handler = Mangum(app)`이다.
- AWS SAM 템플릿은 `backend/template.yaml`에 둔다.
- `sam deploy --guided` 실행 시 최소 `DatabaseUrl`, `JwtSecret`을 주입한다.
- Azure/OpenAI/Supabase 키는 비워도 mock fallback으로 동작하지만, Stage 5 실제 API 검증에는 모두 설정한다.
- 모바일 압축 음성을 Azure로 보내려면 Lambda에 ffmpeg layer를 붙이고 `FFMPEG_BINARY=/opt/bin/ffmpeg`로 둔다.

## 현재 Stage 4 범위

- 완료: 로컬 SQLite 저장소, PostgreSQL 배포 연결 준비, 인증 플로우, 표현/세션/복습 큐 CRUD, SM-2 스케줄러 테스트, OpenAPI JSON 생성.
- 제한: Azure/OpenAI/Supabase는 키 미설정 시 mock fallback으로 동작한다.
- 실제 연동 검증: Azure 발음 평가, GPT 교정/시뮬레이션, OpenAI TTS, Supabase TTS 캐시 통과 기록은 `docs/ai-service-test-log.md`를 따른다.
