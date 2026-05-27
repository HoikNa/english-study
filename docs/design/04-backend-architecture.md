# 04. Backend Architecture
> FastAPI + Mangum + AWS Lambda · Supabase PostgreSQL

---

## 라우터 구조 (도메인별 분리)

| 라우터 파일 | Prefix | 포함 엔드포인트 |
|---|---|---|
| routers/auth.py | /api/v1/auth | register, login, refresh, logout |
| routers/expressions.py | /api/v1/expressions | 목록 조회, 단건 조회, TTS URL 조회, 커스텀 추가/삭제 |
| routers/ai.py | /api/v1/ai | 발음 평가, 피드백, TTS 생성, 시뮬 시작/메시지, 커스텀 표현 변환 |
| routers/sessions.py | /api/v1/sessions | 세션 저장, 이력 조회 |
| routers/review.py | /api/v1/review | 오늘 복습 목록, 수동 등록, SM-2 갱신 |
| routers/reports.py | /api/v1/reports | 주간 리포트 조회, 진도 통계 |

---

## 서비스 레이어 역할 정의

| 서비스 파일 | 책임 범위 |
|---|---|
| services/azure_speech.py | Azure Pronunciation Assessment API 호출, 응답 파싱, 가중 평균 total_score 계산, 에러 시 503 반환 |
| services/gpt_coach.py | GPT-4o 교정 피드백 생성, 대화 시뮬 응답, 커스텀 표현 변환, 시스템 프롬프트 주입, Gemini Flash 자동 전환 로직 |
| services/openai_tts.py | TTS 음성 생성, Supabase Storage 캐시 조회/저장, 속도별 변형 생성 |
| services/sm2_scheduler.py | SM-2 알고리즘 EF 갱신, interval 계산, next_review_at 산출, 복습 큐 조회 |
| services/weekly_report.py | 주간 세션 데이터 집계, GPT 일괄 분석 요청, 리포트 DB 저장 (금요일 배치) |
| services/cost_guard.py | 월별 AI API 호출 카운터 관리, 예산 임계값 도달 시 Gemini Flash 전환 플래그 설정 |

---

## 고수준 DB Helper 목록

| 함수명 | 반환 | 동작 정의 |
|---|---|---|
| fetch_by_id(session, model, id) | model | 404 | ID로 단건 조회. is_deleted=True 또는 미존재 시 HTTPException(404) |
| fetch_list(session, model, skip, limit, **filters) | list[model] | 목록 조회 + 페이징. is_deleted=False 자동 필터 |
| create_item(session, model, data) | model | 생성 후 자동 commit+refresh. created_at/updated_at 자동 주입 |
| update_item(session, item, data) | model | 변경 필드만 setattr 후 commit+refresh. updated_at 자동 갱신 |
| soft_delete(session, item) | None | is_deleted=True 설정 후 commit. 실제 DB 삭제 없음 |
| upsert_item(session, model, data, unique_keys) | model | unique_keys 기준 조회 후 없으면 create, 있으면 update |

---

## 의존성 주입 구조

| 파일 | 역할 |
|---|---|
| dependencies/auth.py | get_current_user(token: HTTPBearer) — JWT 디코딩, 만료 확인, users 조회. 실패 시 401 반환. 모든 🔒 라우터에 Depends로 주입 |
| dependencies/db.py | get_db() — SQLModel Session 생성 후 yield. 요청 종료 시 자동 닫기 |
| dependencies/cost.py | check_budget() — AI 라우터 호출 전 월 예산 확인. 초과 시 429 반환 또는 Gemini 전환 플래그 설정 |

---

## Lambda 핸들러 구조

| 항목 | 내용 |
|---|---|
| handler.py | Lambda 진입점. app/main.py의 Mangum(app) 핸들러를 import |
| app/main.py | FastAPI 앱 생성. CORS 미들웨어 (Expo 앱 스킴 허용). 라우터 6개 등록. Sentry 초기화. Mangum 래핑 |
| 요청 흐름 | API Gateway → Lambda(handler.py) → Mangum → FastAPI Router → Service → DB Helper → Supabase PostgreSQL |
| 콜드 스타트 대응 | Lambda 메모리 512MB 고정. 콜드 스타트 < 5초 목표 |
| 배치 처리 | 주간 리포트: EventBridge Rule로 매주 금요일 23:55 별도 Lambda 트리거 |

---

## 환경변수 목록 (.env.example)

```
# Database
DATABASE_URL=postgresql://user:password@host:5432/speakready

# Auth
JWT_SECRET=
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=1440

# Azure Speech
AZURE_SPEECH_KEY=
AZURE_SPEECH_REGION=eastus

# OpenAI
OPENAI_API_KEY=
OPENAI_TTS_VOICE=nova
OPENAI_GPT_MODEL=gpt-4o

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_KEY=
SUPABASE_STORAGE_BUCKET=tts-cache

# AWS
AWS_REGION=ap-northeast-2

# Monitoring
SENTRY_DSN=
ENVIRONMENT=development

# Cost Control
GPT_MONTHLY_BUDGET_USD=30
```

---

> ℹ️ 2026-05-27 업데이트: `GEMINI_FALLBACK_ENABLED` 및 관련 `cost_guard.py` / Gemini 전환 경로는 descope됨. 1인 사용자 비용 규모(USD 30 예산)에서 fallback 트리거 가능성이 사실상 없어 dead config로 판단, 제거.
