# 10. SM-2 Algorithm Spec
> SuperMemo-2 기반 복습 스케줄러 상세 명세

---

## 개요

SuperMemo-2(SM-2) 알고리즘을 기반으로 쉐도잉 점수에 따라 다음 복습 일정을 자동 계산한다. 점수가 높을수록 복습 간격이 길어지고, 낮을수록 다음 날 재복습한다.

| 항목 | 내용 |
|---|---|
| 알고리즘 기반 | SuperMemo-2 (SM-2). 1987년 Piotr Woźniak 설계. 언어 학습 최적화 |
| 핵심 파라미터 | interval_days: 다음 복습까지 일수 / repetition: 성공 반복 횟수 / ease_factor(EF): 난이도 계수 |
| EF 초기값 | 2.5 (모든 신규 표현). 범위: 1.3(어려움) ~ 2.9(쉬움) |
| 점수 → 등급 | 쉐도잉 total_score (0~100) → SM-2 등급 q (0~5) 변환 필요 |

---

## 점수 → SM-2 등급 변환표

| total_score 범위 | SM-2 등급 q | 평가 의미 | 처리 방식 |
|---|---|---|---|
| 90~100점 | q = 5 | 완벽 반응 | 성공. interval/EF 정상 갱신 |
| 80~89점 | q = 4 | 일부 주저함 후 정답 | 성공. interval/EF 정상 갱신 |
| 70~79점 | q = 3 | 어려움이 있었으나 정답 | 성공. interval 갱신, EF 소폭 감소 |
| 60~69점 | q = 2 | 심각한 어려움, 거의 오답 | 실패. repetition 리셋, interval = 1 |
| 0~59점 | q = 1 | 오답 (오류 기억) | 실패. repetition 리셋, interval = 1 |

---

## interval 계산 규칙

| 조건 | 계산 방법 | 예시 |
|---|---|---|
| q < 3 (실패) | interval = 1, repetition = 0 | 오늘 실패 → 내일 재복습 |
| q ≥ 3, repetition = 0 (첫 성공) | interval = 1 | 처음 성공 → 1일 후 |
| q ≥ 3, repetition = 1 (두 번째) | interval = 6 | 두 번째 성공 → 6일 후 |
| q ≥ 3, repetition ≥ 2 (이후) | interval = round(prev_interval × EF) | EF=2.5, 이전 6일 → 15일 |
| next_review_at 계산 | 현재 시각 + interval_days × 86400초 | 오늘 + interval 일 |

---

## EF (Ease Factor) 갱신 규칙

| 항목 | 내용 |
|---|---|
| 갱신 공식 | 새 EF = EF + (0.1 - (5-q) × (0.08 + (5-q) × 0.02)) |
| EF 최솟값 강제 | 계산 결과가 1.3 미만이면 1.3으로 고정 |
| q=5 시 변화 | EF 소폭 증가 (더 쉬운 표현으로 인식) |
| q=3 시 변화 | EF 소폭 감소 (조금 어려운 표현) |
| q<3 시 변화 | EF 갱신 없음 (실패 시 현재 EF 유지, repetition만 리셋) |

---

## 복습 큐 관리 정책

| 항목 | 내용 |
|---|---|
| 신규 등록 조건 | total_score < 70 (70점 미만 첫 시도) 또는 사용자 수동 등록 |
| 중복 등록 방지 | review_queue UNIQUE(user_id, expression_id). 이미 등록된 표현은 SM-2 갱신만 |
| 복습 우선순위 | next_review_at ASC 정렬 (가장 오래된 복습 먼저) |
| Soft Delete 연동 | is_deleted=True 표현의 review_queue는 조회에서 자동 제외 (JOIN 필터) |
| 복습 완료 처리 | PATCH /review/{expression_id}/update 호출 → SM-2 갱신 → next_review_at 업데이트 |

---

## 테스트 케이스

| 시나리오 | 입력 점수 | repetition | 현재 EF | 기대 결과 |
|---|---|---|---|---|
| 신규 표현 첫 시도 실패 | 55점 | 0 → 0 | 2.5 | interval=1, next=내일 |
| 신규 표현 첫 성공 | 82점 | 0 → 1 | 2.5 → 2.6 | interval=1, next=내일 |
| 두 번째 성공 | 78점 | 1 → 2 | 2.6 → 2.56 | interval=6, next=6일 후 |
| 세 번째 이상 성공 | 91점 | 2 → 3 | 2.56 → 2.66 | interval=round(6×2.56)=15, next=15일 후 |
| 고점 반복 성공 | 95점 | 5 → 6 | 2.7 | interval 기하급수 증가. 장기 기억 형성 |

---

## 역검토 완료 기준

- [ ] interval 계산 로직 pytest 단위 테스트 5케이스 통과
- [ ] EF 최솟값 1.3 강제 적용 확인
- [ ] next_review_at UTC 기준 정상 저장 확인
- [ ] 복습 큐 중복 등록 방지 (UNIQUE constraint) 실제 DB 검증

---

> ✅ 역검토 완료 선언: **설계 역검토 완료 — [날짜]** 를 이 줄에 기록.

---

## 설계 역검토 순서

```
Security(07) → UX Flow(06) → Frontend(05) → Backend(04) → API(02) → DB(01)

모든 문서 작성 완료 후 위 순서로 역검토 시행.
완료 시 각 문서 말미에 '역검토 완료 — [날짜]' 기록.
```
