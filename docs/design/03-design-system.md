# 03. Design System
> NativeWind (TailwindCSS) 기반 모바일 디자인 토큰

---

## 컬러 팔레트

| 구분 | Token명 | Hex | 사용처 |
|---|---|---|---|
| Primary | navy-900 | #0D2B55 | 헤더 배경, 섹션 카드 배경 |
| Primary | blue-700 | #1F4E8C | H2 제목, 강조 버튼 |
| Primary | blue-500 | #2E75B6 | 활성 탭, 링크 |
| Secondary | teal-700 | #0E7C7B | AI 피드백 강조, 점수 카드 |
| Secondary | teal-100 | #D0EFEE | 피드백 배경, 성공 배지 |
| Semantic: 성공 | green-700 | #1E8449 | 80점 이상, 체크 아이콘 |
| Semantic: 경고 | yellow-400 | #F9E79F | 60~79점, 재도전 유도 |
| Semantic: 오류 | red-700 | #C0392B | 59점 이하, 오류 단어 |
| Neutral-50 | gray-50 | #F4F6F8 | 화면 배경, 카드 내부 |
| Neutral-300 | gray-300 | #BDC3C7 | 구분선, 비활성 아이콘 |
| Neutral-700 | gray-700 | #4A4A4A | 본문 텍스트 |

---

## 타이포그래피

| 스타일 | 폰트 크기 | 굵기 | 행간 | 사용처 |
|---|---|---|---|---|
| Heading 1 | 28sp | Bold (700) | 36sp | 화면 제목 (카테고리명, 시나리오명) |
| Heading 2 | 22sp | Bold (700) | 30sp | 섹션 제목 (쉐도잉 플레이어 표현 제목) |
| Heading 3 | 18sp | SemiBold (600) | 26sp | 카드 제목, 상황 레이블 |
| Body Large | 16sp | Regular (400) | 24sp | 학습 표현 영어 원문 (text_en) |
| Body Base | 14sp | Regular (400) | 22sp | 상황 설명, 피드백 텍스트 |
| Caption | 12sp | Regular (400) | 18sp | 점수 수치, 배지 텍스트, 타임스탬프 |
| Label | 13sp | Medium (500) | 20sp | 버튼 레이블, 탭 텍스트 |

---

## 스페이싱 & 반경

| 토큰 | 값 | 사용처 |
|---|---|---|
| spacing-1 | 4dp | 아이콘 내부 여백, 배지 내부 |
| spacing-2 | 8dp | 카드 내부 소간격, 인라인 요소 간격 |
| spacing-3 | 12dp | 리스트 아이템 상하 패딩 |
| spacing-4 | 16dp | 화면 좌우 기본 여백 (page margin) |
| spacing-6 | 24dp | 섹션 간격, 카드 간격 |
| spacing-8 | 32dp | 주요 섹션 상단 여백 |
| radius-sm | 6dp | 배지, 입력 필드, 소형 버튼 |
| radius-md | 12dp | 카드, 팝업, 피드백 패널 |
| radius-lg | 20dp | 바텀 시트, 모달, 녹음 버튼 |
| radius-full | 9999dp | 점수 원형 표시, 아바타 |

---

## 커스텀 컴포넌트 (NativeWind 신규 구현)

| 컴포넌트명 | Props 주요 속성 | 설명 |
|---|---|---|
| ChunkPlayer | chunks[], speed, onChunkEnd, onComplete | 청크 단위 TTS 재생 + 진행 하이라이트. 각 청크 재생 후 자동 일시정지 |
| RecordButton | onRecordStart, onRecordEnd, isRecording, maxSec | 녹음 버튼. 탭 → 녹음 시작, 재탭 or maxSec 도달 → 자동 종료. 파형 애니메이션 |
| ScoreRadar | pron, fluency, prosody, completeness | Azure 4항목 레이더 차트. 각 항목 0~100 시각화 |
| ScoreBar | score, label, prev_score | 단일 항목 점수 바. 이전 점수 대비 화살표 표시 |
| FeedbackCard | original, suggestions[], reasons[] | GPT 교정 결과 카드. 원문 → 교정 표현 3가지 슬라이드 |
| ChunkHighlight | text_en, chunk_json, activeIndex | 전체 표현 텍스트에서 현재 재생 청크 하이라이트 |
| DiffHighlight | original, recognized | 원문 vs. 인식 텍스트 단어 단위 diff. 오류 단어 빨간 밑줄 |
| StreakBadge | count, isToday | 연속 학습 일수 배지. 오늘 학습 여부에 따라 활성/비활성 |
| CategoryTab | categories[], active, onSelect | 생활/비즈니스/IT 탭 전환. 각 탭에 완료율 표시 |
| AudioSpeedPicker | speeds[], selected, onChange | 0.75x / 1.0x / 1.25x 속도 선택 버튼 그룹 |

---

## 레이아웃 패턴

| 패턴 | 구성 방식 |
|---|---|
| 인증 레이아웃 | SafeAreaView → ScrollView → 중앙 정렬 카드. 상단 앱 로고, 하단 소셜 로그인 버튼 |
| 탭 네비게이션 | Expo Router Tabs. 하단 탭: 홈 / 카테고리 / 복습 / 진도. 아이콘 + 레이블 |
| 쉐도잉 플레이어 | 전체 화면. 상단 표현/점수 영역 + 중앙 청크 하이라이트 + 하단 컨트롤 (재생/녹음/속도) |
| 피드백 패널 | 하단 슬라이드 바텀 시트. 점수 카드 + 교정 피드백 + 재도전/다음 CTA |
| 대화 시뮬 | 채팅 UI. 상단 시나리오 정보 + 중앙 메시지 스크롤 + 하단 음성 입력 버튼 |
| 홈 대시보드 | 스크롤 뷰. 오늘 진도 카드 + 복습 알림 배너 + 빠른 시작 버튼 + 스트릭 |

---

> ✅ 역검토 포인트: RecordButton이 Expo Audio API 녹음 권한 요청과 연계되는지 `06-ux-flow.md`에서 확인 필요.
