import React from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { C, spacing, shadow } from '@/lib/theme';
import { ChevronIcon } from '@/components/common/Icons';
import { SectionLabel } from '@/components/common/SectionLabel';
import { ScreenState } from '@/components/common/ScreenState';
import { MetricTile } from '@/components/common/MetricTile';
import { GoalList } from '@/components/report/GoalList';
import { PatternCard, ReportPattern } from '@/components/report/PatternCard';
import { useWeeklyReport } from '@/hooks/useLearningData';

export default function WeeklyReportScreen() {
  const { week } = useLocalSearchParams<{ week?: string }>();
  const weeklyQuery = useWeeklyReport(week);
  const report = weeklyQuery.data;

  if (!report && weeklyQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenState loading title="주간 리포트를 불러오는 중" message="이번 주 세션과 패턴을 집계하고 있어요." />
      </SafeAreaView>
    );
  }

  if (!report || weeklyQuery.isError) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenState
          title="주간 리포트를 불러오지 못했어요"
          message="백엔드 연결을 확인한 뒤 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() => weeklyQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  const patterns: ReportPattern[] = report.patterns;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Dark hero */}
        <View style={styles.hero}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronIcon dir="left" color={C.paper} size={20} />
          </Pressable>

          <View style={styles.heroContent}>
            <Text style={styles.weekLabel}>{report.weekRange} · 주간 리포트</Text>
            <Text style={styles.heroQuote}>이번 주 학습 패턴을 정리했어요.</Text>

            {/* Stats row */}
            <View style={styles.statsRow}>
              <MetricTile dark value={report.totalSessions} label="세션" />
              <View style={styles.statDivider} />
              <MetricTile dark value={report.expressionsPracticed} label="표현 연습" />
              <View style={styles.statDivider} />
              <MetricTile dark value={report.avgScore} suffix=" pts" label="평균 점수" />
              <View style={styles.statDivider} />
              <MetricTile dark accent value={`${report.scoreChange >= 0 ? '+' : ''}${report.scoreChange}`} label="점수 향상" />
            </View>
          </View>
        </View>

        {/* Patterns section */}
        <View style={styles.body}>
          <View style={styles.patternHeader}>
            <SectionLabel>자주 틀린 패턴 TOP 3</SectionLabel>
            <Text style={styles.patternSubtitle}>이번 주 AI가 감지한 개선 포인트</Text>
          </View>

          {patterns.length === 0 ? (
            <View style={styles.emptyPatterns}>
              <Text style={styles.emptyPatternsTitle}>아직 리포트를 만들 데이터가 부족해요</Text>
              <Text style={styles.emptyPatternsText}>이번 주에 몇 개의 세션을 쌓으면 패턴과 목표가 더 정확해집니다.</Text>
            </View>
          ) : patterns.map((pattern) => (
            <PatternCard key={pattern.rank} pattern={pattern} />
          ))}

          {/* CTA */}
          <Pressable
            style={({ pressed }) => [styles.ctaBtn, pressed && { opacity: 0.88 }]}
            onPress={() => router.push('/review')}
          >
            <Text style={styles.ctaBtnText}>이 패턴들로 복습 세션 만들기 →</Text>
          </Pressable>

          {/* Next week target */}
          <View style={styles.nextWeekCard}>
            <SectionLabel style={{ marginBottom: 8 }}>다음 주 목표</SectionLabel>
            <GoalList goals={report.goals} />
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
  emptyPatterns: {
    marginHorizontal: spacing.screenH,
    marginBottom: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.line,
  },
  emptyPatternsTitle: { fontSize: 14, fontWeight: '700', color: C.ink, marginBottom: 4 },
  emptyPatternsText: { fontSize: 12, color: C.muted, lineHeight: 18 },

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
