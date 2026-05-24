# 08. AI Prompt Library
> GPT-4o 시스템 프롬프트 전체 목록 · SpeakReadyMY 전용

---

## 프롬프트 공통 지침

| 항목 | 내용 |
|---|---|
| 사용자 컨텍스트 (고정) | 45세 한국인 / 국내 통신사 IT서비스개발기획자 / 토익 850 / 회화 중하 / 브로큰 잉글리쉬 자주 사용 / 미국 이민 후 IT 비즈니스 목표 |
| 응답 언어 | 피드백·설명: 한국어 / 영어 예시: 영어 원문 유지 |
| 응답 길이 제한 | 피드백: 200자 이내 / 대화 시뮬 응답: 3문장 이내 / 리포트: 300자 이내 |
| max_tokens | 모든 GPT 호출 공통: 300 토큰 고정 |
| temperature | 교정 피드백: 0.3 (일관성) / 대화 시뮬: 0.8 (자연스러움) / 리포트: 0.4 |

---

## 프롬프트 목록

### P-01 — 발음 교정 피드백

- **입력 변수**: `{target_sentence}` `{azure_recognized_text}` `{pron_score}` `{fluency_score}` `{prosody_score}`
- **출력 구조**:
  1. 가장 어색한 표현 지적 (구체적으로)
  2. 원어민 대안 표현 3가지 + 이유 (한국어)
  3. IT 비즈니스 상황에서 중요도 1줄

### P-02 — IT 미팅 대화 시뮬

- **입력 변수**: `{scenario_code}` `{history_json}` `{user_message}`
- **출력 구조**: 3문장 이내 미국인 CTO 응답 + `[코치: 교정 코멘트]` + 질문으로 마무리

### P-03 — IoT 파트너십 협상 시뮬

- **입력 변수**: `{scenario_code}` `{history_json}` `{user_message}`
- **출력 구조**: 협상 상대 역할. 가격/조건 제시. 브로큰 잉글리쉬 `[ ]` 코멘트

### P-04 — 생활영어 롤플레이 시뮬

- **입력 변수**: `{scenario_code}` `{history_json}` `{user_message}`
- **출력 구조**: 미국인 일반인 역할. 자연스러운 대화. `[ ]` 코멘트

### P-05 — 커스텀 표현 변환

- **입력 변수**: `{korean_sentence}` `{context_hint}`
- **출력 구조**: text_en / situation_desc_ko (2문장) / level (1~3) / category

### P-06 — 주간 약점 리포트

- **입력 변수**: `{sessions_summary_json}` `{prev_week_avg}`
- **출력 구조**: top_3_errors `[{pattern, count, suggestion}]` / analysis_ko (총평 300자) / improvement_tip_ko

### P-07 — 고급 표현 추천

- **입력 변수**: `{simple_expression}` `{context}`
- **출력 구조**: 더 자연스러운 표현 3가지 / 각 사용 상황 / 난이도 레벨

---

## Gemini 2.5 Flash 전환 기준

| 프롬프트 | GPT-4o 유지 조건 | Gemini Flash 전환 조건 |
|---|---|---|
| P-01 (발음 교정) | 항상 GPT-4o 유지 (품질 중요) | — |
| P-02~04 (대화 시뮬) | 맥락 복잡도 높은 IT/협상 시나리오 | 월 API 비용 $20 초과 시 |
| P-05 (커스텀 변환) | 항상 GPT-4o 유지 (정확성 중요) | — |
| P-06 (주간 리포트) | — | Gemini Flash 기본 사용 (배치 처리) |
| P-07 (고급 표현) | — | Gemini Flash 기본 사용 |

---

> ✅ 역검토 포인트: P-02~04 시나리오 코드가 `01-database-model.md` simulations 테이블의 scenario_code Enum과 일치하는지 확인.
