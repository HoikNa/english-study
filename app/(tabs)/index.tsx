import React, { useMemo } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView,
} from 'react-native';
import { Href, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, spacing, radius, shadow } from '@/lib/theme';
import { Card } from '@/components/common/Card';
import { SectionLabel } from '@/components/common/SectionLabel';
import { ScreenState } from '@/components/common/ScreenState';
import { PlayIcon, ChevronIcon } from '@/components/common/Icons';
import { StreakBadge } from '@/components/home/StreakBadge';
import { mockExpressions, mockReviewQueue, mockStats, mockStreak } from '@/lib/mocks/expressions.mock';
import { pickTodayBlock, SOUND_BLOCK_CATEGORY_LABELS } from '@/lib/data/sound_blocks';
import { useProgressStats, useReviewToday, useTodayExpression } from '@/hooks/useLearningData';
import { useDialogueToday } from '@/hooks/useDialogue';
import { getApiErrorMessage, USE_MOCK } from '@/lib/api';
import { useAuthStore } from '@/stores/auth.store';

const SETTINGS_ROUTE = '/settings' as Href;
const FALLBACK_STATS = {
  pronScore: 0,
  weeklyChange: 0,
  totalExpressions: 0,
  streak: { days: 0, weekFlags: [false, false, false, false, false, false, false] },
};

const SIMULATE_SCENARIOS: { id: string; name: string; brief: string; avatar: string }[] = [
  { id: 'iot-meeting', name: 'Marcus · CTO', brief: 'IoT 통합 첫 미팅. 회사 역량·레이턴시·아키텍처 강점을 설득.', avatar: 'M' },
  { id: 'requirements', name: 'Sarah · PM', brief: '요구사항 협의. 수락 조건·이해관계자 기대치 조율.', avatar: 'S' },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const progressQuery = useProgressStats();
  const reviewQuery = useReviewToday();
  const expressionQuery = useTodayExpression();
  const { data: progressStats } = progressQuery;
  const { data: reviewToday } = reviewQuery;
  const { data: todayExpression } = expressionQuery;

  const hasCriticalError = expressionQuery.isError;
  const hasNoExpression = !expressionQuery.isLoading && !expressionQuery.isError && todayExpression === null;
  const isInitialLoading = !progressStats && !todayExpression && (progressQuery.isLoading || expressionQuery.isLoading);
  const sessionExpression = todayExpression ?? (USE_MOCK ? mockExpressions.find((item) => item.id === 'exp-011') ?? mockExpressions[0] : undefined);
  const stats = progressStats ?? (USE_MOCK ? { ...mockStats, streak: mockStreak } : sessionExpression ? FALLBACK_STATS : undefined);
  const reviewQueue = reviewToday?.items ?? (USE_MOCK ? mockReviewQueue : []);
  const today = new Date();
  const dateLabel = today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });
  const dialogueTodayQuery = useDialogueToday();
  const todayDialogue = dialogueTodayQuery.data;
  const openTodayDialogue = () => {
    if (todayDialogue) router.push(`/dialogue/${todayDialogue.id}` as Href);
  };
  const todayBlock = useMemo(() => pickTodayBlock(), []);
  const openTodayBlock = () => router.push(`/block/${todayBlock.id}` as Href);
  const bottomContentPadding = 168 + Math.max(insets.bottom, 48);

  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenState loading title="오늘 학습을 불러오는 중" message="실제 백엔드에서 학습 현황을 가져오고 있어요." />
      </SafeAreaView>
    );
  }

  if (hasNoExpression) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenState
          title="오늘 학습할 표현이 없어요"
          message="학습 표현을 추가하면 여기에 추천 표현이 나타납니다."
          actionLabel="표현 추가하기"
          onAction={() => router.push('/custom/add')}
        />
      </SafeAreaView>
    );
  }

  if (hasCriticalError || !stats || !sessionExpression) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenState
          title="오늘 학습을 불러오지 못했어요"
          message={expressionQuery.error ? getApiErrorMessage(expressionQuery.error) : '백엔드 연결 상태를 확인한 뒤 다시 시도해 주세요.'}
          actionLabel="다시 시도"
          onAction={() => {
            progressQuery.refetch();
            expressionQuery.refetch();
            reviewQuery.refetch();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomContentPadding }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateLabel}>DAY {stats.streak.days} · {dateLabel}</Text>
            <Text style={styles.greeting}>
              안녕하세요, <Text style={styles.name}>{user?.name ?? 'Learner'}</Text>
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="설정 열기"
            onPress={() => router.push(SETTINGS_ROUTE)}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{user?.name?.[0] ?? 'L'}</Text>
          </Pressable>
        </View>

        {/* Streak strip */}
        <View style={styles.section}>
          <StreakBadge days={stats.streak.days} weekFlags={stats.streak.weekFlags} />
        </View>

        {/* Today's session card — 대화 듣기 중심 */}
        {todayDialogue ? (
        <View style={styles.section}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`오늘의 대화 ${todayDialogue.situationKo} 듣기 시작`}
            hitSlop={6}
            onPress={openTodayDialogue}
            style={({ pressed }) => [
              styles.sessionCard,
              shadow.cardFloat,
              pressed && styles.sessionCardPressed,
            ]}
          >
            {/* Dark top */}
            <View style={styles.sessionTop}>
              <View style={styles.sessionMeta}>
                <SectionLabel light>오늘의 대화</SectionLabel>
                <Text style={styles.sessionTime}>{todayDialogue.turns.length} TURNS</Text>
              </View>
              <Text style={styles.sessionTitle}>{todayDialogue.situationKo}</Text>
              <Text style={styles.sessionSub}>
                {todayDialogue.category === 'business' ? '비즈니스' : todayDialogue.category.toUpperCase()} · Level {todayDialogue.level} · 키 표현 {todayDialogue.turns.filter((tr) => tr.expressionId).length}개
              </Text>
              <View style={styles.sessionActions}>
                <View style={styles.startBtn}>
                  <PlayIcon size={14} />
                  <Text style={styles.startBtnText}>대화 듣기 시작</Text>
                </View>
                <View style={styles.chevronBtn}>
                  <ChevronIcon color="rgba(245,240,230,0.6)" />
                </View>
              </View>
            </View>
            {/* Stats bottom */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>최근 발음</Text>
                <Text style={styles.statValue}>
                  {stats.pronScore}<Text style={styles.statUnit}>/100</Text>
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>이번 주</Text>
                <Text style={styles.statValue}>
                  +{stats.weeklyChange}<Text style={{ color: C.sage, fontSize: 11 }}>%</Text>
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>학습 표현</Text>
                <Text style={styles.statValue}>{stats.totalExpressions}</Text>
              </View>
            </View>
          </Pressable>
        </View>
        ) : null}

        {/* 오늘의 블록 — 작은 보조 카드 (대화 옆에 패턴 학습) */}
        <View style={styles.section}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`오늘의 블록 ${todayBlock.name} 학습`}
            onPress={openTodayBlock}
            style={({ pressed }) => [styles.blockCard, pressed && { opacity: 0.92 }]}
          >
            <View style={styles.blockCardInner}>
              <View style={styles.blockCardInfo}>
                <Text style={styles.blockCardLabel}>오늘의 블록</Text>
                <View style={styles.blockCardTitleRow}>
                  <Text style={styles.blockCardTitle}>{todayBlock.name}</Text>
                  {todayBlock.partsLabel ? (
                    <Text style={styles.blockCardPart}>{todayBlock.partsLabel}</Text>
                  ) : null}
                </View>
                <Text style={styles.blockCardMeta} numberOfLines={1}>
                  {SOUND_BLOCK_CATEGORY_LABELS[todayBlock.category]} · 예문 {todayBlock.examples.length}개
                </Text>
              </View>
              <ChevronIcon color={C.muted2} />
            </View>
          </Pressable>
        </View>

        {/* 복습 큐 — paper2 큰 카드, 안에 흰 sub 카드 */}
        <View style={styles.section}>
          <View style={styles.contentCard}>
            <View style={styles.contentCardHead}>
              <Text style={styles.contentCardTitle}>복습 큐</Text>
              <Pressable onPress={() => router.push('/review')}>
                <Text style={styles.contentCardLink}>{reviewQueue.length}개 대기 →</Text>
              </Pressable>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewScroll}>
              {reviewQueue.length === 0 ? (
                <View style={styles.emptyReviewCard}>
                  <Text style={styles.emptyReviewTitle}>오늘 복습 없음</Text>
                  <Text style={styles.emptyReviewSub}>카드를 열면 최근 학습 데이터와 다시 녹음 버튼을 볼 수 있어요.</Text>
                </View>
              ) : reviewQueue.map((item) => (
                <Pressable
                  key={item.id}
                  style={({ pressed }) => [
                    styles.reviewCard,
                    pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                  ]}
                  onPress={() => router.push('/review')}
                >
                  <Text style={[styles.reviewScore, { color: item.lastScore < 60 ? C.rose : C.gold }]}>
                    {item.lastScore}점
                  </Text>
                  <Text style={styles.reviewEn} numberOfLines={1}>{item.expression.textEn}</Text>
                  <Text style={styles.reviewKo}>
                    {item.expression.situationKo} · {item.nextReviewAt < new Date().toISOString() ? '오늘' : '내일'}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        {/* AI 시뮬레이션 — paper2 큰 카드, 안에 흰 row */}
        <View style={styles.section}>
          <View style={styles.contentCard}>
            <View style={styles.contentCardHead}>
              <Text style={styles.contentCardTitle}>AI 시뮬레이션</Text>
              <Text style={styles.contentCardMuted}>롤플레이</Text>
            </View>
            <View style={styles.simulateList}>
              {SIMULATE_SCENARIOS.map((s) => (
                <Pressable
                  key={s.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${s.name} 시뮬레이션 시작`}
                  style={({ pressed }) => [styles.simulateRow, pressed && styles.simulateRowPressed]}
                  onPress={() => router.push(`/simulate/${s.id}` as Href)}
                >
                  <View style={styles.simulateRowInner}>
                    <View style={styles.simulateAvatar}>
                      <Text style={styles.simulateAvatarText}>{s.avatar}</Text>
                    </View>
                    <View style={styles.simulateRowInfo}>
                      <Text style={styles.simulateName}>{s.name}</Text>
                      <Text style={styles.simulateBrief} numberOfLines={2}>{s.brief}</Text>
                    </View>
                    <ChevronIcon color={C.muted2} />
                  </View>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        {/* 유틸 행 (직접 추가 + 카테고리) — 미니멀 1행 텍스트 */}
        <View style={styles.section}>
          <View style={styles.utilList}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="내 표현 추가"
              onPress={() => router.push('/custom/add')}
              style={({ pressed }) => [styles.utilRow, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.utilIconAccent}>+</Text>
              <Text style={styles.utilLabel}>내 표현 만들기</Text>
              <ChevronIcon color={C.muted2} />
            </Pressable>
            <View style={styles.utilDivider} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="학습 카테고리 둘러보기"
              onPress={() => router.push('/(tabs)/categories')}
              style={({ pressed }) => [styles.utilRow, pressed && { opacity: 0.6 }]}
            >
              <Text style={styles.utilIcon}>▦</Text>
              <Text style={styles.utilLabel}>카테고리 둘러보기</Text>
              <ChevronIcon color={C.muted2} />
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper },
  scroll: { paddingTop: 8 },
  section: { paddingHorizontal: spacing.screenH, marginBottom: 12 },

  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.screenH, paddingBottom: 16, paddingTop: 8,
  },
  dateLabel: { fontSize: 11, fontWeight: '600', color: C.muted, letterSpacing: 0.5, fontFamily: 'InterSemiBold' },
  greeting: { fontSize: 26, fontWeight: '700', letterSpacing: -0.78, marginTop: 2, fontFamily: 'InterBold' },
  name: { fontFamily: 'InstrumentSerifItalic', fontSize: 26, fontWeight: '400' },
  avatar: {
    width: 38, height: 38, borderRadius: 999, backgroundColor: C.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { color: C.paper, fontWeight: '700', fontSize: 13 },

  sessionCard: {
    borderRadius: 22, overflow: 'hidden',
    borderWidth: 0.5, borderColor: C.line, backgroundColor: C.card,
  },
  sessionCardPressed: { opacity: 0.92, transform: [{ scale: 0.99 }] },
  sessionTop: { backgroundColor: C.ink, padding: 16, paddingBottom: 18 },
  sessionMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  sessionTime: { fontSize: 11, color: 'rgba(245,240,230,0.5)', fontFamily: 'IBMPlexMono' },
  sessionTitle: { fontSize: 20, fontWeight: '600', color: C.paper, letterSpacing: -0.4, marginTop: 6, lineHeight: 26 },
  sessionSub: { fontSize: 12, color: 'rgba(245,240,230,0.65)', marginTop: 4 },
  sessionActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  startBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, padding: 12, backgroundColor: C.accent, borderRadius: 12,
  },
  startBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  chevronBtn: {
    width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  statsRow: { flexDirection: 'row', padding: 14, paddingHorizontal: 18, gap: 16 },
  statItem: { flex: 1 },
  statLabel: { fontSize: 10, color: C.muted, letterSpacing: 0.8, fontWeight: '600', fontFamily: 'InterSemiBold' },
  statValue: { fontSize: 18, fontWeight: '700', marginTop: 2, fontFamily: 'InterBold' },
  statUnit: { color: C.muted2, fontSize: 11 },
  statDivider: { width: 0.5, backgroundColor: C.line },

  reviewScroll: { overflow: 'visible' },
  reviewCard: {
    width: 120, padding: 12, backgroundColor: C.card,
    borderRadius: 14, borderWidth: 0.5, borderColor: C.line, marginRight: 10,
  },
  reviewScore: { fontSize: 11, fontWeight: '700', fontFamily: 'IBMPlexMonoSemiBold' },
  reviewEn: { fontSize: 12, fontWeight: '600', color: C.ink, marginTop: 6 },
  reviewKo: { fontSize: 10, color: C.muted, marginTop: 3 },
  emptyReviewCard: {
    width: 220,
    padding: 14,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: C.line,
  },
  emptyReviewTitle: { color: C.ink, fontSize: 13, fontWeight: '800' },
  emptyReviewSub: { color: C.muted, fontSize: 11, lineHeight: 16, marginTop: 4 },

  // Concept B: paper2 큰 컨테이너 카드 (복습 큐 / AI 시뮬레이션 공용)
  contentCard: {
    backgroundColor: C.paper2,
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  contentCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  contentCardTitle: { fontSize: 16, fontWeight: '800', color: C.ink },
  contentCardLink: { fontSize: 12, fontWeight: '700', color: C.accent },
  contentCardMuted: { fontSize: 11, fontWeight: '700', color: C.muted },

  // 오늘의 블록 카드
  blockCard: { borderRadius: 16, overflow: 'hidden' },
  blockCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: C.paper2,
    borderRadius: 16,
  },
  blockCardInfo: { flex: 1, minWidth: 0 },
  blockCardLabel: { fontSize: 10, fontWeight: '700', color: C.accent, letterSpacing: 1.1, textTransform: 'uppercase' },
  blockCardTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  blockCardTitle: { fontSize: 15, fontWeight: '800', color: C.ink },
  blockCardPart: { fontSize: 10, fontWeight: '600', color: C.muted2 },
  blockCardMeta: { fontSize: 11, color: C.muted, marginTop: 3 },

  // AI 시뮬레이션 row (white, inside paper2)
  simulateList: { gap: 8 },
  simulateRow: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  simulateRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.line,
    borderRadius: 12,
  },
  simulateRowPressed: { opacity: 0.85 },
  simulateRowInfo: { flex: 1, minWidth: 0 },
  simulateAvatar: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.paper2,
    alignItems: 'center', justifyContent: 'center',
  },
  simulateAvatarText: { fontSize: 14, fontWeight: '700', color: C.ink },
  simulateName: { fontSize: 13, fontWeight: '700', color: C.ink },
  simulateBrief: { fontSize: 11, lineHeight: 14, color: C.muted, marginTop: 2 },

  // 유틸 행 (직접 추가 + 카테고리) — 미니멀 1행
  utilList: {
    paddingHorizontal: 4,
  },
  utilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
  },
  utilIconAccent: { fontSize: 18, fontWeight: '800', color: C.accent, width: 20, textAlign: 'center' },
  utilIcon: { fontSize: 14, fontWeight: '700', color: C.muted, width: 20, textAlign: 'center' },
  utilLabel: { flex: 1, fontSize: 14, fontWeight: '600', color: C.ink },
  utilDivider: { height: 0.5, backgroundColor: C.line },
});
