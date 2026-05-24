# 05. Frontend Architecture
> React Native + Expo Router · NativeWind · Zustand · TanStack Query

---

## Expo Router 폴더 구조

| 경로 | 역할 |
|---|---|
| app/_layout.tsx | 루트 레이아웃. Providers (QueryClient, Auth) 래핑. Sentry 초기화 |
| app/(auth)/onboarding.tsx | 레벨 테스트 + 목적 선택 + 첫 모듈 배정. 비로그인 진입 허용 |
| app/(tabs)/_layout.tsx | 하단 탭 네비게이션 정의 (홈/카테고리/복습/진도) |
| app/(tabs)/index.tsx | 홈 대시보드. 오늘 목표, 복습 알림, 스트릭, 빠른 시작 |
| app/(tabs)/categories.tsx | 카테고리 + 상황 목록. 진도율 표시 |
| app/(tabs)/review.tsx | 오늘 복습 세션. SM-2 큐 기반 자동 표현 제공 |
| app/(tabs)/progress.tsx | 학습 진도 차트, 카테고리별 달성률, 주간 리포트 |
| app/shadowing/[id].tsx | 쉐도잉 플레이어 화면. expression_id 파라미터 |
| app/simulate/[scenario].tsx | GPT 대화 시뮬. scenario 코드 파라미터 |
| app/report/weekly.tsx | 주간 약점 리포트. GPT 분석 결과 표시 |
| app/custom/add.tsx | 커스텀 표현 추가. 한국어 입력 → GPT 변환 → 등록 |
| app/settings.tsx | 알림 설정, TTS 보이스, 속도 기본값, 계정 |
| components/common/ | AudioPlayer, RecordButton, ScoreRadar, FeedbackCard 등 (03-design-system 정의) |
| components/shadowing/ | ChunkPlayer, ChunkHighlight, DiffHighlight — 쉐도잉 화면 전용 |
| lib/api.ts | Axios 클라이언트. EXPO_PUBLIC_USE_MOCK 분기. 401 시 토큰 자동 갱신 |
| lib/mocks/ | Mock 데이터 파일. expressions.mock.ts, sessions.mock.ts, review.mock.ts |
| stores/ | Zustand 스토어 3종 (auth, learning, audio) |
| hooks/ | useAzurePronunciation, useGptFeedback, useTts, useSmScheduler |
| types/ | Expression, Session, ReviewQueue, Simulation, WeeklyReport TypeScript 타입 |

---

## 상태관리 전략

| 기준 | 클라이언트 컴포넌트 (Zustand) | 서버 데이터 (TanStack Query) |
|---|---|---|
| 데이터 원천 | Zustand 스토어 (로컬 상태) | API 서버 (expressions, sessions, review) |
| 적용 화면 | 오디오 재생 상태, 녹음 진행, UI 토글 | 카테고리 목록, 복습 큐, 진도 통계 |
| 업데이트 주기 | 사용자 인터랙션 즉시 반응 | staleTime: 5분 / gcTime: 30분 |
| 오프라인 대응 | Zustand persist (AsyncStorage) | TanStack Query 캐시 (메모리) |

---

## Zustand 스토어 정의

| 스토어 | 상태 구조 | 주요 액션 |
|---|---|---|
| auth.store.ts | user(User|null), token(string|null), isLoading | setUser, setToken, logout. AsyncStorage persist 적용 |
| learning.store.ts | currentExpression, sessionProgress, todayStats, streakCount | setCurrentExpression, recordAttempt, updateStreak. 화면 이동 시 초기화 |
| audio.store.ts | isPlaying, currentChunkIndex, speed(0.75|1.0|1.25), isRecording, recordingUri | play, pause, nextChunk, setSpeed, startRecording, stopRecording |

---

## TanStack Query 쿼리 키 전략

| 쿼리 키 | 데이터 | 갱신 트리거 |
|---|---|---|
| ['expressions', category, situation, level] | 표현 목록 (필터 조합) | 필터 변경 시 자동 갱신 |
| ['expression', id] | 단건 표현 상세 | id 변경 시 |
| ['review', 'today'] | 오늘 복습 대상 목록 | 세션 저장 후 invalidate |
| ['sessions', expressionId] | 표현별 세션 이력 | 새 세션 저장 후 invalidate |
| ['progress'] | 전체 학습 통계 | 세션 저장 후 5분 stale |
| ['report', 'weekly', weekStart] | 주간 리포트 | 주차 변경 또는 금요일 이후 |

---

## Mock 전략

| 항목 | 내용 |
|---|---|
| Mock 파일 위치 | src/lib/mocks/ — expressions.mock.ts, sessions.mock.ts, review.mock.ts, reports.mock.ts |
| Mock 전환 방식 | EXPO_PUBLIC_USE_MOCK=true 설정 시 lib/api.ts에서 Mock 핸들러로 분기 |
| Mock 데이터 기준 | PRD 섹션 7 Top 10 표현 상황 + 각 3개 표현 = 최소 30개 Mock 표현 |
| Azure Mock | 발음 점수를 랜덤(60~95) 반환하는 Mock 함수. 실제 STT 없이 UI 개발 가능 |
| GPT Mock | 고정된 피드백 3개를 순환 반환. 지연 시간 1초 시뮬레이션 포함 |
| 삭제 시점 | Stage 5 통합 단계에서 EXPO_PUBLIC_USE_MOCK=false 전환. Mock 파일 자체는 유지 |

---

> ✅ 역검토 포인트: audio.store.ts의 isRecording 상태가 RecordButton 컴포넌트와 단방향 흐름인지 확인.
