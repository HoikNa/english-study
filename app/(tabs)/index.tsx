import React from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView,
} from 'react-native';
import { Href, router } from 'expo-router';
import { C, spacing, radius, shadow } from '@/lib/theme';
import { Card } from '@/components/common/Card';
import { SectionLabel } from '@/components/common/SectionLabel';
import { PlayIcon, ChevronIcon } from '@/components/common/Icons';
import { ProgressLine } from '@/components/common/ProgressLine';
import { StreakBadge } from '@/components/home/StreakBadge';
import { mockExpressions, mockReviewQueue, mockStats, mockStreak } from '@/lib/mocks/expressions.mock';
import { useExpression, useProgressStats, useReviewToday } from '@/hooks/useLearningData';

const SETTINGS_ROUTE = '/settings' as Href;
const TODAY_EXPRESSION_ID = 'exp-011';

export default function HomeScreen() {
  const { data: progressStats } = useProgressStats();
  const { data: reviewToday } = useReviewToday();
  const { data: todayExpression } = useExpression(TODAY_EXPRESSION_ID);

  const stats = progressStats ?? { ...mockStats, streak: mockStreak };
  const reviewQueue = reviewToday?.items ?? mockReviewQueue;
  const sessionExpression = todayExpression ?? mockExpressions.find((item) => item.id === TODAY_EXPRESSION_ID) ?? mockExpressions[0];
  const today = new Date();
  const dateLabel = today.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.dateLabel}>DAY 23 · {dateLabel}</Text>
            <Text style={styles.greeting}>
              안녕하세요, <Text style={styles.name}>Hoik</Text>
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="설정 열기"
            onPress={() => router.push(SETTINGS_ROUTE)}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>H</Text>
          </Pressable>
        </View>

        {/* Streak strip */}
        <View style={styles.section}>
          <StreakBadge days={stats.streak.days} weekFlags={stats.streak.weekFlags} />
        </View>

        {/* Today's session card */}
        <View style={styles.section}>
          <View style={[styles.sessionCard, shadow.cardFloat]}>
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
                <Pressable
                  style={({ pressed }) => [styles.startBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] }]}
                  onPress={() => router.push(`/shadowing/${sessionExpression.id}`)}
                >
                  <PlayIcon size={14} />
                  <Text style={styles.startBtnText}>쉐도잉 시작</Text>
                </Pressable>
                <Pressable style={styles.chevronBtn}>
                  <ChevronIcon color="rgba(245,240,230,0.6)" />
                </Pressable>
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
          </View>
        </View>

        {/* Review queue */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SectionLabel>복습 큐</SectionLabel>
            <Pressable onPress={() => router.push('/(tabs)/review')}>
              <Text style={styles.seeAll}>{reviewQueue.length}개 대기 →</Text>
            </Pressable>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.reviewScroll}>
            {reviewQueue.map((item) => (
              <Pressable
                key={item.id}
                style={({ pressed }) => [
                  styles.reviewCard,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.97 }] },
                ]}
                onPress={() => router.push('/(tabs)/review')}
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

        {/* Continue learning */}
        <View style={[styles.section, { paddingBottom: 24 }]}>
          <SectionLabel style={{ marginBottom: 10 }}>이어서 학습</SectionLabel>
          <View style={styles.continueList}>
            {[
              { tag: '생활', name: '집 계약 / 렌트', n: '3/8', pct: 38, color: C.sage },
              { tag: '비즈니스', name: '요구사항 협의', n: '5/12', pct: 42, color: C.accent },
            ].map((row, i) => (
              <Pressable
                key={i}
                style={({ pressed }) => [
                  styles.continueRow,
                  pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
                ]}
                onPress={() => router.push('/(tabs)/categories')}
              >
                <View style={styles.continueTag}>
                  <Text style={styles.continueTagText}>{row.tag}</Text>
                </View>
                <View style={styles.continueInfo}>
                  <Text style={styles.continueName}>{row.name}</Text>
                  <View style={styles.continueProgress}>
                    <ProgressLine value={row.pct} label={row.n} fillClassName={row.color === C.sage ? 'bg-sage' : 'bg-accent'} />
                  </View>
                </View>
                <ChevronIcon />
              </Pressable>
            ))}
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

  continueList: { gap: 8 },
  continueRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 12, paddingHorizontal: 14,
    backgroundColor: C.card, borderRadius: 14, borderWidth: 0.5, borderColor: C.line,
  },
  continueTag: {
    width: 38, height: 38, borderRadius: 10, backgroundColor: C.paper2,
    alignItems: 'center', justifyContent: 'center',
  },
  continueTagText: { fontSize: 10, fontWeight: '700', color: C.ink2 },
  continueInfo: { flex: 1 },
  continueName: { fontSize: 13, fontWeight: '600' },
  continueProgress: { marginTop: 4 },
});
