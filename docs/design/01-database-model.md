# 01. Database Model
> PRD v2.3 기반 · SQLModel · Supabase PostgreSQL

---

## 공통 컬럼 규칙

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID | PK, 자동생성 | 모든 테이블 기본 키. uuid4 자동 생성 |
| created_at | DateTime | NOT NULL, 자동입력 | 레코드 최초 생성 시각 (UTC) |
| updated_at | DateTime | NOT NULL, 자동갱신 | 레코드 마지막 수정 시각 (UTC) |
| is_deleted | Boolean | DEFAULT false | Soft Delete 여부. 실제 삭제 없이 논리 삭제 |

---

## 테이블 정의

### ① users — 사용자

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID | PK | 공통 규칙 |
| email | String(255) | UNIQUE, NOT NULL | Supabase Auth 연동 이메일 |
| level | Enum(1,2,3) | NOT NULL, DEFAULT 1 | 학습 레벨. 온보딩 테스트 결과 |
| goal | Enum | NOT NULL | 학습 목적: DAILY / BUSINESS / IT |
| daily_target_min | Integer | DEFAULT 20 | 하루 목표 학습 시간(분) |
| streak_count | Integer | DEFAULT 0 | 연속 학습 일수 |
| last_studied_at | DateTime | NULLABLE | 마지막 학습 시각 |
| created_at / updated_at / is_deleted | — | — | 공통 컬럼 |

---

### ② expressions — 학습 표현 마스터

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID | PK | 공통 규칙 |
| category | Enum | NOT NULL, IDX | DAILY / BUSINESS / IT |
| situation | Enum | NOT NULL, IDX | 상황 코드 (예: LEASE, DINING, MEETING) |
| level | Integer(1~3) | NOT NULL, IDX | 난이도 레벨 |
| text_en | Text | NOT NULL | 영어 원문 |
| text_ko | Text | NOT NULL | 한국어 번역/설명 |
| situation_desc_ko | Text | NOT NULL | 상황 설명 (한국어 2~3문장) |
| chunk_json | JSON | NOT NULL | 청크 분할 배열. `[{text, order, pause_ms}]` |
| audio_url | String(500) | NULLABLE | Supabase Storage TTS 캐시 경로 |
| audio_speed_urls | JSON | NULLABLE | 속도별 캐시. `{0.75: url, 1.0: url, 1.25: url}` |
| is_custom | Boolean | DEFAULT false | 커스텀 표현 여부 (사용자 직접 추가) |
| created_at / updated_at / is_deleted | — | — | 공통 컬럼 |

---

### ③ sessions — 쉐도잉 시도 기록

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID | PK | 공통 규칙 |
| user_id | UUID | FK → users.id, IDX | Cascade: 사용자 삭제 시 세션도 삭제 |
| expression_id | UUID | FK → expressions.id, IDX | Cascade: 표현 삭제 시 세션도 삭제 |
| attempt_number | Integer | NOT NULL | 해당 표현의 몇 번째 시도인지 |
| pron_score | Float | NULLABLE | Azure 발음 정확도 (0~100) |
| fluency_score | Float | NULLABLE | Azure 유창성 점수 (0~100) |
| prosody_score | Float | NULLABLE | Azure 억양 점수 (0~100) |
| completeness_score | Float | NULLABLE | Azure 완성도 점수 (0~100) |
| total_score | Float | NULLABLE | 4항목 가중 평균. 복습 등록 기준 |
| word_errors_json | JSON | NULLABLE | 단어별 오류. `[{word, error_type, offset}]` |
| gpt_feedback_json | JSON | NULLABLE | GPT 교정 결과. `[{original, suggestion, reason_ko}]` |
| duration_sec | Float | NULLABLE | 발화 소요 시간(초) |
| created_at / updated_at | — | — | 공통 컬럼 (is_deleted 미적용) |

---

### ④ review_queue — SM-2 복습 큐

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID | PK | 공통 규칙 |
| user_id | UUID | FK → users.id, IDX | — |
| expression_id | UUID | FK → expressions.id | UNIQUE(user_id, expression_id) |
| interval_days | Integer | DEFAULT 1 | 다음 복습까지 일수 (SM-2) |
| repetition | Integer | DEFAULT 0 | 성공 반복 횟수 (SM-2) |
| ease_factor | Float | DEFAULT 2.5 | 복습 난이도 계수 (SM-2, 1.3~2.9) |
| next_review_at | DateTime | NOT NULL, IDX | 다음 복습 예정 시각 |
| last_score | Float | NULLABLE | 마지막 시도 점수 |
| total_attempts | Integer | DEFAULT 0 | 총 시도 횟수 |
| created_at / updated_at / is_deleted | — | — | 공통 컬럼 |

---

### ⑤ simulations — GPT 대화 시뮬 세션

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID | PK | — |
| user_id | UUID | FK → users.id, IDX | — |
| scenario_code | Enum | NOT NULL | MEETING / NEGOTIATE / PITCH / LEASE / MEDICAL 등 |
| messages_json | JSON | NOT NULL | `[{role, content, coach_comment_ko, timestamp}]` |
| total_turns | Integer | DEFAULT 0 | 총 대화 턴 수 |
| broken_count | Integer | DEFAULT 0 | 브로큰 잉글리쉬 감지 횟수 |
| duration_sec | Integer | NULLABLE | 세션 총 소요 시간(초) |
| created_at / updated_at | — | — | 공통 컬럼 |

---

### ⑥ weekly_reports — 주간 약점 리포트

| 컬럼명 | 타입 | 제약조건 | 설명 |
|---|---|---|---|
| id | UUID | PK | — |
| user_id | UUID | FK → users.id, IDX | UNIQUE(user_id, week_start) |
| week_start | Date | NOT NULL | 주차 시작일 (월요일 기준) |
| total_sessions | Integer | DEFAULT 0 | 해당 주 총 시도 횟수 |
| avg_score | Float | NULLABLE | 주간 평균 점수 |
| improvement_pct | Float | NULLABLE | 전주 대비 점수 향상률(%) |
| top_errors_json | JSON | NULLABLE | Top 3 브로큰 패턴. `[{pattern, count, suggestion_ko}]` |
| gpt_analysis_ko | Text | NULLABLE | GPT 생성 한국어 분석 리포트 (200자 이내) |
| categories_stats_json | JSON | NULLABLE | 카테고리별 학습량. `{DAILY: n, BUSINESS: n, IT: n}` |
| created_at | — | — | 공통 컬럼 |

---

## 테이블 관계 (ERD 요약)

| 부모 테이블 | 관계 | 자식 테이블 | Cascade 정책 |
|---|---|---|---|
| users | 1 : N | sessions | 사용자 삭제(Soft) → 세션 Soft Delete |
| users | 1 : N | review_queue | 사용자 삭제(Soft) → 복습 큐 Soft Delete |
| users | 1 : N | simulations | 사용자 삭제(Soft) → 시뮬 Soft Delete |
| users | 1 : N | weekly_reports | 사용자 삭제(Soft) → 리포트 Soft Delete |
| expressions | 1 : N | sessions | 표현 Soft Delete → 세션은 유지 (통계 보존) |
| expressions | 1 : N | review_queue | 표현 Soft Delete → 복습 큐 Soft Delete |

---

## 인덱스 전략

| 테이블 | 인덱스 컬럼 | 사유 |
|---|---|---|
| expressions | category, situation, level | 카테고리/상황별 표현 목록 조회 (메인 화면 필터) |
| expressions | is_custom, is_deleted | 커스텀 표현 목록 조회 |
| sessions | user_id, created_at DESC | 사용자별 학습 이력 최근순 조회 |
| sessions | expression_id, user_id | 표현별 시도 이력 조회 (진도 계산) |
| review_queue | user_id, next_review_at | 오늘 복습 대상 표현 조회 (홈 알림) |
| review_queue | user_id, expression_id (UNIQUE) | 중복 등록 방지 |
| simulations | user_id, created_at DESC | 대화 기록 최근순 조회 |
| weekly_reports | user_id, week_start (UNIQUE) | 주차별 리포트 조회 |

---

> ✅ 역검토 포인트: 모든 FK가 실제 테이블·컬럼을 참조하는지 `02-api-spec.md` 작성 후 대조 확인 필수.
