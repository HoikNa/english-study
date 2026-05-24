# 02. API Specification
> RESTful API 전체 명세 · FastAPI · AWS Lambda

---

## 공통 규칙

| 항목 | 내용 |
|---|---|
| Base URL | `https://[api-gw-id].execute-api.ap-northeast-2.amazonaws.com/prod` |
| API 버전 | `/api/v1` prefix 사용 |
| 인증 방식 | `Authorization: Bearer {JWT}` — 🔒 표시 엔드포인트 필수 |
| Content-Type | `application/json` (요청/응답 모두) |
| 페이징 방식 | offset 기반: `?skip=0&limit=20` (기본값) |
| 날짜 형식 | ISO 8601: `2026-05-01T09:00:00Z` |
| UUID 형식 | 하이픈 포함 소문자: `550e8400-e29b-41d4-a716-446655440000` |

---

## 에러 코드 정의

| HTTP | 에러 코드 | 설명 및 발생 상황 |
|---|---|---|
| 400 | VALIDATION_ERROR | 요청 Body/Param 형식 오류 |
| 401 | UNAUTHORIZED | JWT 없음 또는 만료 |
| 403 | FORBIDDEN | 인증은 됐으나 해당 리소스에 접근 권한 없음 |
| 404 | NOT_FOUND | 존재하지 않는 리소스 |
| 409 | CONFLICT | 중복 데이터 (review_queue 동일 표현 재등록 등) |
| 429 | RATE_LIMIT | API 호출 한도 초과 (Azure/GPT 월 예산 소진) |
| 500 | INTERNAL_ERROR | 서버 내부 오류 (Sentry 자동 전송) |
| 503 | AI_SERVICE_DOWN | Azure/OpenAI API 다운 시 폴백 응답 |

---

## 엔드포인트 목록

### 인증 (Auth)

| 🔒 | Method | 경로 | 설명 | 응답 |
|---|---|---|---|---|
| | POST | /api/v1/auth/register | 회원가입 | 201 {user_id, token} |
| | POST | /api/v1/auth/login | 로그인 | 200 {access_token, refresh_token} |
| | POST | /api/v1/auth/refresh | Access 토큰 갱신 | 200 {access_token} |
| 🔒 | POST | /api/v1/auth/logout | 로그아웃 | 204 |

### 학습 표현 (Expressions)

| 🔒 | Method | 경로 | 설명 | 응답 |
|---|---|---|---|---|
| 🔒 | GET | /api/v1/expressions?category=&situation=&level=&skip=&limit= | 표현 목록 조회 (필터+페이징) | 200 {items[], total} |
| 🔒 | GET | /api/v1/expressions/{id} | 표현 단건 조회 | 200 Expression |
| 🔒 | GET | /api/v1/expressions/{id}/tts?speed=1.0 | TTS 음성 URL 조회 (캐시 우선) | 200 {audio_url} |
| 🔒 | POST | /api/v1/expressions/custom | 커스텀 표현 추가 (GPT 변환) | 201 Expression |
| 🔒 | DELETE | /api/v1/expressions/{id}/custom | 커스텀 표현 삭제 (Soft Delete) | 204 |

### AI 코칭 (AI Services)

| 🔒 | Method | 경로 | 설명 | 응답 |
|---|---|---|---|---|
| 🔒 | POST | /api/v1/ai/pronunciation | Azure 발음 평가 요청 | 200 PronResult |
| 🔒 | POST | /api/v1/ai/feedback | GPT 표현 교정 피드백 | 200 FeedbackResult |
| 🔒 | POST | /api/v1/ai/tts/generate | TTS 음성 생성 및 캐싱 | 200 {audio_url} |
| 🔒 | POST | /api/v1/ai/simulate/start | 대화 시뮬 시작 | 200 {simulation_id, first_message} |
| 🔒 | POST | /api/v1/ai/simulate/{id}/message | 대화 시뮬 메시지 전송 | 200 {reply, coach_comment_ko} |
| 🔒 | POST | /api/v1/ai/custom-expression | 한국어 → 영어 표현 GPT 변환 | 200 {text_en, situation_desc_ko} |

### 세션 / 복습 / 리포트

| 🔒 | Method | 경로 | 설명 | 응답 |
|---|---|---|---|---|
| 🔒 | POST | /api/v1/sessions | 쉐도잉 시도 결과 저장 | 201 Session |
| 🔒 | GET | /api/v1/sessions?expression_id=&skip=&limit= | 세션 이력 조회 | 200 {items[], total} |
| 🔒 | GET | /api/v1/review/today | 오늘 복습 대상 목록 | 200 {items[], count} |
| 🔒 | POST | /api/v1/review/{expression_id}/enqueue | 복습 큐 수동 등록 | 201 ReviewQueue |
| 🔒 | PATCH | /api/v1/review/{expression_id}/update | SM-2 값 갱신 | 200 ReviewQueue |
| 🔒 | GET | /api/v1/reports/weekly?week= | 주간 리포트 조회 | 200 WeeklyReport |
| 🔒 | GET | /api/v1/reports/progress | 전체 진도 통계 (대시보드용) | 200 ProgressStats |

---

## 주요 Request/Response 구조

### POST /api/v1/ai/pronunciation

**Request**

| 필드 | 타입 | 설명 |
|---|---|---|
| expression_id | UUID | 평가 대상 표현 ID |
| audio_file | File (multipart) | 사용자 녹음 파일 (.wav, 최대 10초) |
| reference_text | String | Azure 비교 기준 원문 (expression.text_en) |

**Response (PronResult)**

| 필드 | 타입 | 설명 |
|---|---|---|
| pron_score | Float | 발음 정확도 (0~100) |
| fluency_score | Float | 유창성 (0~100) |
| prosody_score | Float | 억양·리듬 (0~100) |
| completeness_score | Float | 문장 완성도 (0~100) |
| total_score | Float | 가중 평균 (pron×0.4 + fluency×0.3 + prosody×0.2 + completeness×0.1) |
| word_errors | Array | `[{word, error_type(Omission|Mispronunciation|Insertion), offset}]` |
| recognized_text | String | Azure STT 인식 텍스트 |

---

> ✅ 역검토 포인트: POST /ai/pronunciation의 audio_file 크기 제한 및 Azure 서비스 리전 확인 필요.
