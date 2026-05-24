import React from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { C, spacing, shadow } from '@/lib/theme';
import { ChevronIcon } from '@/components/common/Icons';
import { SectionLabel } from '@/components/common/SectionLabel';
import { MetricTile } from '@/components/common/MetricTile';
import { GoalList } from '@/components/report/GoalList';
import { PatternCard, ReportPattern } from '@/components/report/PatternCard';

const MOCK_PATTERNS: ReportPattern[] = [
  {
    rank: '01',
    bad: 'I have built IoT platform for 5G',
    good: "I've led IoT platform development for 5G",
    why: '경험·역량 어필 시 주도성 강조. "built"보다 "led"가 시니어 포지션에 맞습니다.',
    category: 'Leadership tone',
  },
  {
    rank: '02',
    bad: 'Our system can connect with your edge',
    good: 'Our platform integrates seamlessly with your edge infrastructure',
    why: '기술 역량은 구체적 동사와 명사로. "connect"는 너무 단순하게 들립니다.',
    category: 'Technical precision',
  },
  {
    rank: '03',
    bad: "I think it is maybe possible",
    good: "That's certainly feasible — let me outline the approach",
    why: '불확실한 표현은 신뢰도를 낮춥니다. 자신감 있게 다음 액션으로 이어가세요.',
    category: 'Confidence register',
  },
];

const MOCK_STATS = {
  quote: "Progress is built one session at a time.",
  weekRange: '5월 16일 – 22일',
  sessionsCompleted: 12,
  expressionsPracticed: 34,
  avgScore: 76,
  scoreChange: +8,
  topCategory: 'IT 미팅',
};

const WEEKLY_GOALS = [
  { mark: '01', text: '평균 점수 80pt 달성' },
  { mark: '02', text: '7일 연속 스트릭 유지' },
  { mark: '03', text: '커스텀 표현 3개 추가' },
];

export default function WeeklyReportScreen() {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Dark hero */}
        <View style={styles.hero}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronIcon dir="left" color={C.paper} size={20} />
          </Pressable>

          <View style={styles.heroContent}>
            <Text style={styles.weekLabel}>{MOCK_STATS.weekRange} · 주간 리포트</Text>
            <Text style={styles.heroQuote}>"{MOCK_STATS.quote}"</Text>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <MetricTile dark value={MOCK_STATS.sessionsCompleted} label="세션" />
              <View style={styles.statDivider} />
              <MetricTile dark value={MOCK_STATS.expressionsPracticed} label="표현 연습" />
              <View style={styles.statDivider} />
              <MetricTile dark value={MOCK_STATS.avgScore} suffix=" pts" label="평균 점수" />
              <View style={styles.statDivider} />
              <MetricTile dark accent value={`+${MOCK_STATS.scoreChange}`} label="점수 향상" />
            </View>
          </View>
        </View>

        {/* Patterns section */}
        <View style={styles.body}>
          <View style={styles.patternHeader}>
            <SectionLabel>자주 틀린 패턴 TOP 3</SectionLabel>
            <Text style={styles.patternSubtitle}>이번 주 AI가 감지한 개선 포인트</Text>
          </View>

          {MOCK_PATTERNS.map((pattern) => (
            <PatternCard key={pattern.rank} pattern={pattern} />
          ))}

          {/* CTA */}
          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.88 }]}
            onPress={() => router.push('/(tabs)/review')}
          >
            <Text style={styles.ctaBtnText}>이 패턴들로 복습 세션 만들기 →</Text>
          </Pressable>

          {/* Next week target */}
          <View style={styles.nextWeekCard}>
            <SectionLabel style={{ marginBottom: 8 }}>다음 주 목표</SectionLabel>
            <GoalList goals={WEEKLY_GOALS} />
          </View>

          <View style={{ height: 40 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.ink },

  hero: {
    backgroundColor: C.ink,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: spacing.screenH,
  },
  backBtn: { padding: 4, alignSelf: 'flex-start', marginBottom: 20 },
  heroContent: {},
  weekLabel: {
    fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.45)',
    letterSpacing: 0.8, marginBottom: 14, fontFamily: 'IBMPlexMono',
  },
  heroQuote: {
    fontSize: 22, color: C.paper,
    fontFamily: 'InstrumentSerifItalic',
    lineHeight: 30, marginBottom: 28,
  },

  statsRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 16, paddingVertical: 16, paddingHorizontal: 12,
  },
  statDivider: { width: 0.5, height: 32, backgroundColor: 'rgba(255,255,255,0.15)' },

  body: { backgroundColor: C.paper, paddingTop: 28 },

  patternHeader: { paddingHorizontal: spacing.screenH, marginBottom: 16, gap: 4 },
  patternSubtitle: { fontSize: 12, color: C.muted, marginTop: 2 },

  ctaBtn: {
    marginHorizontal: spacing.screenH, marginTop: 4, marginBottom: 20,
    paddingVertical: 16, borderRadius: 16,
    backgroundColor: C.ink, alignItems: 'center',
    ...shadow.cardFloat,
  },
  ctaBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },

  nextWeekCard: {
    marginHorizontal: spacing.screenH,
    padding: 16, backgroundColor: C.goldSoft,
    borderRadius: 16, borderWidth: 0.5, borderColor: C.gold + '40',
  },
});
