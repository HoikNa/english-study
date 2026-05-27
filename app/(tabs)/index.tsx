import React from 'react';
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
import { useProgressStats, useReviewToday, useTodayExpression } from '@/hooks/useLearningData';
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
  const openTodayShadowing = (expressionId: string) => router.push(`/shadowing/${expressionId}`);
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

        {/* Today's session card */}
        <View style={styles.section}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`오늘의 학습 ${sessionExpression.situationKo} 쉐도잉 시작`}
            hitSlop={6}
            onPress={() => openTodayShadowing(sessionExpression.id)}
            style={({ pressed }) => [
              styles.sessionCard,
              shadow.cardFloat,
              pressed && styles.sessionCardPressed,
            ]}
          >
            {/* Dark top */}
            <View style={styles.sessionTop}>
              <View style={styles.sessionMeta}>
                <SectionLabel light>오늘의 학습</SectionLabel>
                <Text style={styles.sessionTime}>20 MIN</Text>
              </View>
              <Text style={styles.sessionTitle}>{sessionExpression.situationKo}</Text>
              <Text style={styles.sessionSub}>
                {sessionExpression.category === 'business' ? '비즈니스' : sessionExpression.category.toUpperCase()} · Level {sessionExpression.level} · {sessionExpression.chunks.length}개 청크
              </Text>
              <View style={styles.sessionActions}>
                <View style={styles.startBtn}>
                  <PlayIcon size={14} />
                  <Text style={styles.startBtnText}>쉐도잉 시작</Text>
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

        {/* Review queue */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SectionLabel>복습 큐</SectionLabel>
            <Pressable onPress={() => router.push('/review')}>
              <Text style={styles.seeAll}>{reviewQueue.length}개 대기 · 최근 학습 →</Text>
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

        {/* AI 시뮬레이션 (1열 리스트) */}
        <View style={styles.section}>
          <SectionLabel style={{ marginBottom: 10 }}>AI 시뮬레이션</SectionLabel>
          <View style={styles.simulateList}>
            {SIMULATE_SCENARIOS.map((s) => (
              <Pressable
                key={s.id}
                accessibilityRole="button"
                accessibilityLabel={`${s.name} 시뮬레이션 시작`}
                style={({ pressed }) => [styles.simulateRow, pressed && styles.simulateRowPressed]}
                onPress={() => router.push(`/simulate/${s.id}` as Href)}
              >
                <View style={styles.simulateAvatar}>
                  <Text style={styles.simulateAvatarText}>{s.avatar}</Text>
                </View>
                <View style={styles.simulateRowInfo}>
                  <Text style={styles.simulateName}>{s.name}</Text>
                  <Text style={styles.simulateBrief} numberOfLines={2}>{s.brief}</Text>
                </View>
                <ChevronIcon />
              </Pressable>
            ))}
          </View>
        </View>

        {/* 표현 직접 추가 (항상 노출) — 쉐도잉 시작 카드와 동일한 강조 패턴 */}
        <View style={styles.section}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="내 표현 추가"
            onPress={() => router.push('/custom/add')}
            style={({ pressed }) => [styles.addExpressionCard, shadow.cardSubtle, pressed && { opacity: 0.92 }]}
          >
            <View style={styles.addExpressionCardInner}>
              <View style={styles.addExpressionInfo}>
                <Text style={styles.addExpressionLabel}>직접 추가</Text>
                <Text style={styles.addExpressionTitle}>나만의 표현 만들기</Text>
                <Text style={styles.addExpressionSub}>한국어 입력 → AI가 영어로 변환</Text>
              </View>
              <View style={styles.addExpressionCta}>
                <Text style={styles.addExpressionCtaText}>+</Text>
              </View>
            </View>
          </Pressable>
        </View>

        {/* 카테고리 둘러보기 */}
        <View style={styles.section}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="학습 카테고리 둘러보기"
            onPress={() => router.push('/(tabs)/categories')}
            style={({ pressed }) => [styles.browseBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.browseTitle}>카테고리 둘러보기</Text>
            <Text style={styles.browseSub}>생활 · 비즈니스 · IT/통신 표현 모음</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper },
  scroll: { paddingTop: 8 },
  section: { paddingHorizontal: spacing.screenH, marginBottom: 12 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 10 },
  seeAll: { fontSize: 11, color: C.accent, fontWeight: '600' },

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

  browseBtn: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: C.line,
    gap: 4,
  },
  browseTitle: { fontSize: 13, fontWeight: '700', color: C.ink },
  browseSub: { fontSize: 11, color: C.muted },

  simulateList: { gap: 8 },
  simulateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    paddingHorizontal: 14,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: C.line,
  },
  simulateRowPressed: { opacity: 0.85, transform: [{ scale: 0.98 }] },
  simulateRowInfo: { flex: 1, minWidth: 0 },
  simulateAvatar: {
    width: 38, height: 38, borderRadius: 19, backgroundColor: C.paper2,
    alignItems: 'center', justifyContent: 'center',
  },
  simulateAvatarText: { fontSize: 14, fontWeight: '700', color: C.ink },
  simulateName: { fontSize: 13, fontWeight: '700', color: C.ink },
  simulateBrief: { fontSize: 11, lineHeight: 15, color: C.muted, marginTop: 2 },

  addExpressionCard: {
    borderRadius: 18,
    overflow: 'hidden',
  },
  addExpressionCardInner: {
    backgroundColor: C.ink,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 18,
    paddingHorizontal: 18,
  },
  addExpressionInfo: { flex: 1 },
  addExpressionLabel: {
    color: 'rgba(245,240,230,0.62)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontFamily: 'InterSemiBold',
    marginBottom: 4,
  },
  addExpressionTitle: { color: C.paper, fontSize: 17, fontWeight: '800' },
  addExpressionSub: { color: 'rgba(245,240,230,0.62)', fontSize: 12, marginTop: 3 },
  addExpressionCta: {
    width: 52, height: 52, borderRadius: 16, backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  addExpressionCtaText: { color: '#fff', fontSize: 28, fontWeight: '800', lineHeight: 30 },
});
