# 09. Content Schema
> 학습 표현 데이터 구조 · 카테고리/상황 코드표 · MVP 수량 계획

---

## 카테고리 & 상황 코드표

| category | situation_code | 한국어 명칭 | MVP 포함 |
|---|---|---|---|
| DAILY | LEASE | 집 계약/렌트 | ✅ MVP (Phase 1) |
| DAILY | MEDICAL | 병원/약국 | ✅ MVP (Phase 1) |
| DAILY | SCHOOL | 자녀 학교 상담 | ✅ MVP (Phase 1) |
| DAILY | SHOPPING | 마트/쇼핑 | ✅ MVP (Phase 1) |
| DAILY | DINING | 식당 주문 | ✅ MVP (Phase 1) |
| DAILY | DMV | 운전면허/DMV | ✅ MVP (Phase 1) |
| DAILY | BANKING | 은행/계좌 개설 | ✅ MVP (Phase 1) |
| DAILY | GOVERNMENT | 관공서/우편 | Phase 2 |
| DAILY | NEIGHBOR | 이웃 대화 | Phase 2 |
| DAILY | EMERGENCY | 긴급상황 | Phase 2 |
| BUSINESS | MEETING | 파트너십 첫 미팅 | Phase 2 |
| BUSINESS | PITCH | IT 서비스 제안 | Phase 2 |
| BUSINESS | REQUIREMENTS | 요구사항 협의 | Phase 2 |
| BUSINESS | SCHEDULING | 일정/마일스톤 조율 | Phase 2 |
| BUSINESS | NEGOTIATION | 견적 & 계약 협상 | Phase 2 |
| BUSINESS | FOLLOWUP | Follow-up 이메일 | Phase 2 |
| IT | SPRINT | 스프린트/애자일 미팅 | Phase 2 |
| IT | FIVEG_IOT | 5G/IoT 기술 설명 | Phase 2 |
| IT | CLOUD_ARCH | 클라우드 아키텍처 논의 | Phase 2 |
| IT | API_INTEGRATION | API 연동 협의 | Phase 2 |
| IT | DEBUGGING | 디버깅 & 이슈 리포팅 | Phase 2 |

---

## 레벨별 표현 기준

| 레벨 | 단어 수 기준 | 구조 복잡도 | 예시 (DINING 상황) |
|---|---|---|---|
| 1 (초급) | 5~8단어 이하 | 단문. 주어+동사+목적어 기본 구조 | "I'd like to order." |
| 2 (중급) | 10~15단어 | 복문 가능. 조건/이유 절 포함 | "Could I have the menu, please? I have a nut allergy." |
| 3 (실전) | 15단어 이상 또는 2~3문장 | 응용 + 변형. 비즈니스 뉘앙스 포함 | "I'd prefer a quieter table if possible. We're having a business lunch." |

---

## 청크 분할 기준 (chunk_json 구조)

| 항목 | 내용 |
|---|---|
| chunk_json 구조 | `[{text: '청크 텍스트', order: 1, pause_ms: 800}]` |
| 최소 청크 수 | 2청크 이상 (1청크짜리 단문은 전체=청크) |
| 최대 청크 수 | 4청크 이하 |
| 분할 기준 우선순위 | ① 콤마/마침표 경계 → ② 전치사구 → ③ 접속사 → ④ 의미 단위 |
| pause_ms 기준 | 청크 간 기본 800ms. 강조 구간 1200ms. 레벨 1은 1000ms |
| 예시 (레벨 2) | 원문: "Could I have the menu, please? I have a nut allergy." → [{text:"Could I have the menu, please?", order:1, pause_ms:1000}, {text:"I have a nut allergy.", order:2, pause_ms:800}] |

---

## MVP 콘텐츠 수량 계획

| 상황 (MVP 7종) | 레벨 1 | 레벨 2 | 레벨 3 | 소계 |
|---|---|---|---|---|
| LEASE (집 계약) | 10 | 10 | 5 | 25개 |
| MEDICAL (병원) | 10 | 10 | 5 | 25개 |
| SCHOOL (학교 상담) | 10 | 10 | 5 | 25개 |
| SHOPPING (쇼핑) | 10 | 10 | — | 20개 |
| DINING (식당) | 10 | 10 | — | 20개 |
| DMV (운전면허) | 10 | 10 | — | 20개 |
| BANKING (은행) | 10 | 10 | — | 20개 |
| **합계** | **70** | **70** | **15** | **155개** |

---

> ✅ 역검토 포인트: chunk_json의 pause_ms 값이 ChunkPlayer 컴포넌트의 타이머 로직과 일치하는지 확인.
