import React from 'react';
import {
  View, Text, ScrollView, StyleSheet, SafeAreaView, Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { C, spacing } from '@/lib/theme';
import { Card } from '@/components/common/Card';
import { SectionLabel } from '@/components/common/SectionLabel';
import { ScreenState } from '@/components/common/ScreenState';
import { ScoreRing } from '@/components/common/ScoreRing';
import { Chip } from '@/components/common/Chip';
import { CategoryProgressRow } from '@/components/progress/CategoryProgressRow';
import { ChevronIcon } from '@/components/common/Icons';
import { mockCategoryProgress, mockStats, mockStreak } from '@/lib/mocks/expressions.mock';
import { USE_MOCK } from '@/lib/api';
import { useProgressStats } from '@/hooks/useLearningData';

const CHART_POINTS: [number, number][] = [
  [10, 92], [60, 88], [110, 80], [160, 76], [210, 72], [260, 64], [310, 56],
];

const WEEKS = ['W18', 'W19', 'W20', 'W21', 'W22', 'W23', 'W24'];

const CATEGORY_COLORS = [C.sage, C.accent, C.indigo, C.gold] as const;

const linePath = `M ${CHART_POINTS.map(([x, y]) => `${x} ${y}`).join(' L ')}`;
const fillPath = `${linePath} L 310 120 L 10 120 Z`;

export default function ProgressScreen() {
  const insets = useSafeAreaInsets();
  const progressQuery = useProgressStats();
  const stats = progressQuery.data ?? (USE_MOCK ? { ...mockStats, streak: mockStreak, categories: mockCategoryProgress } : undefined);
  const dayCount = stats?.streak.days ?? 0;
  const pronScore = Math.round(stats?.pronScore ?? 0);
  const weeklyChange = Math.round(stats?.weeklyChange ?? 0);
  const bottomContentPadding = 168 + Math.max(insets.bottom, 48);

  if (!stats && progressQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenState loading title="진도 데이터를 불러오는 중" message="학습 점수와 카테고리 달성률을 가져오고 있어요." />
      </SafeAreaView>
    );
  }

  if (!stats || progressQuery.isError) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenState
          title="진도 데이터를 불러오지 못했어요"
          message="백엔드 연결을 확인한 뒤 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() => progressQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomContentPadding }} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.sub}>나의 진척</Text>
            <Text style={styles.title}>
              <Text style={styles.titleSerif}>{dayCount}일째</Text> 입니다
            </Text>
          </View>
          <Pressable
            style={({ pressed }) => [styles.weeklyBtn, pressed && { opacity: 0.78 }]}
            onPress={() => router.push('/report/weekly')}
          >
            <Text style={styles.weeklyBtnText}>주간 리포트</Text>
            <ChevronIcon size={12} color={C.ink} />
          </Pressable>
        </View>

        {/* Big score ring */}
        <View style={styles.section}>
          <Card style={styles.ringCard} padding={18}>
            <View style={styles.ringRow}>
              <ScoreRing value={pronScore} size={120} strokeWidth={10} color={C.sage} label="발음" />
              <View style={styles.ringInfo}>
                <Text style={styles.ringLabel}>전체 평균 발음</Text>
                <View style={styles.ringValueRow}>
                  <Text style={styles.ringValue}>{pronScore}</Text>
                  <Text style={styles.ringUnit}>/ 100</Text>
                  <Chip color={C.sage} bg={C.sageSoft} style={styles.deltaChip}>
                    {weeklyChange >= 0 ? '+' : ''}{weeklyChange}
                  </Chip>
                </View>
                <Text style={styles.ringComment}>
                  지난 4주간 꾸준한 상승.
                  {'\n'}
                  <Text style={styles.ringCommentBold}>80점</Text>까지 한 걸음.
                </Text>
              </View>
            </View>
          </Card>
        </View>

        {/* Line chart */}
        <View style={styles.section}>
          <Card padding={16}>
            <View style={styles.chartHeader}>
              <SectionLabel>발음 점수 추이</SectionLabel>
              <Text style={styles.chartPeriod}>지난 4주</Text>
            </View>
            <Svg width="100%" height={120} viewBox="0 0 320 120" preserveAspectRatio="none">
              {[0, 25, 50, 75, 100].map((y) => (
                <Line
                  key={y} x1="0" y1={120 - y * 1.2} x2="320" y2={120 - y * 1.2}
                  stroke={C.line} strokeWidth="0.5" strokeDasharray="2 3"
                />
              ))}
              <Line x1="0" y1={24} x2="320" y2={24}
                stroke={C.sage} strokeWidth="0.8" strokeDasharray="4 4" />
              <SvgText x="314" y="20" fontSize="9" fill={C.sage} textAnchor="end" fontWeight="600">
                목표 80
              </SvgText>
              <Path d={fillPath} fill={C.paper2} opacity="0.6" />
              <Path d={linePath} fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" />
              {CHART_POINTS.map(([x, y], i) => (
                <Circle key={i} cx={x} cy={y} r={i === 6 ? 4 : 2.5}
                  fill={i === 6 ? C.accent : C.ink} />
              ))}
              <SvgText x="310" y="50" fontSize="11" fontWeight="700" fill={C.accent} textAnchor="end">
                78
              </SvgText>
            </Svg>
            <View style={styles.xAxis}>
              {WEEKS.map((w) => (
                <Text key={w} style={styles.xLabel}>{w}</Text>
              ))}
            </View>
          </Card>
        </View>

        {/* Category progress */}
        <View style={styles.section}>
          <SectionLabel style={{ marginBottom: 10 }}>카테고리별 달성률</SectionLabel>
          <View style={styles.catList}>
            {stats.categories.map((cat, index) => {
              const percent = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
              const count = cat.category === 'custom' ? `${cat.completed}` : `${cat.completed} / ${cat.total}`;
              return (
              <CategoryProgressRow
                key={cat.name}
                name={cat.name}
                count={count}
                percent={percent}
                color={CATEGORY_COLORS[index % CATEGORY_COLORS.length]}
              />
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper },
  header: {
    paddingHorizontal: spacing.screenH,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: 12,
  },
  sub: { fontSize: 11, fontWeight: '600', color: C.muted, letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.78, marginTop: 2 },
  titleSerif: { fontFamily: 'InstrumentSerifItalic', fontSize: 26, fontWeight: '400' },
  weeklyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 999,
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.line,
  },
  weeklyBtnText: { fontSize: 11, fontWeight: '700', color: C.ink },

  section: { paddingHorizontal: spacing.screenH, marginBottom: 14 },

  ringCard: { borderRadius: 22 },
  ringRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  ringInfo: { flex: 1 },
  ringLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 0.8 },
  ringValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 },
  ringValue: { fontSize: 28, fontWeight: '700', letterSpacing: -0.84, fontFamily: 'InterBold' },
  ringUnit: { fontSize: 11, color: C.muted2 },
  deltaChip: { marginLeft: 4, paddingVertical: 2, paddingHorizontal: 7 },
  ringComment: { fontSize: 11, color: C.muted, marginTop: 8, lineHeight: 16 },
  ringCommentBold: { color: C.ink2, fontWeight: '600' },

  chartHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 },
  chartPeriod: { fontSize: 10, color: C.muted, fontFamily: 'IBMPlexMono' },
  xAxis: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },
  xLabel: { fontSize: 9, color: C.muted, fontFamily: 'IBMPlexMono' },

  catList: { gap: 10 },
});
