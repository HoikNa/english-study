import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, spacing } from '@/lib/theme';
import { Card } from '@/components/common/Card';
import { SectionLabel } from '@/components/common/SectionLabel';
import { ScreenState } from '@/components/common/ScreenState';
import { Chip } from '@/components/common/Chip';
import { MicIcon, PlayIcon } from '@/components/common/Icons';
import { MiniWaveform } from '@/components/common/MiniWaveform';
import { mockReviewQueue } from '@/lib/mocks/expressions.mock';
import { USE_MOCK } from '@/lib/api';
import { ReviewGrade, Session } from '@/types';
import { useRecentSessions, useReviewToday, useSessions, useUpdateReview } from '@/hooks/useLearningData';
import { calculateSm2 } from '@/hooks/useSmScheduler';
import { useTts } from '@/hooks/useTts';

const SCORE_BY_GRADE: Record<ReviewGrade, number> = { hard: 55, ok: 76, easy: 92 };

function intervalLabel(days: number) {
  if (days <= 1) return '내일 다시';
  return `${days}일 뒤`;
}

function relativeDateLabel(value?: string) {
  if (!value) return '최근 학습 기록 없음';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '최근 학습 기록 없음';

  const diffMs = Date.now() - date.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays <= 0) return '오늘 학습';
  if (diffDays === 1) return '어제 학습';
  if (diffDays < 7) return `${diffDays}일 전 학습`;
  return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function scoreTone(score?: number) {
  if (score === undefined || score === null) return { color: C.muted, bg: C.paper2 };
  if (score >= 85) return { color: C.sage, bg: C.sageSoft };
  if (score >= 70) return { color: C.gold, bg: C.goldSoft };
  return { color: C.rose, bg: C.accentSoft };
}

function reviewFocus(session?: Session) {
  const word = session?.wordErrors?.find((item) => item.errorType !== 'None' || item.accuracyScore < 75);
  if (word) return `${word.word}: 정확도 ${Math.round(word.accuracyScore)}점`;
  if (session?.gptFeedback?.issue) return session.gptFeedback.issue;
  if (session?.recognizedText) return `최근 인식: ${session.recognizedText}`;
  return '최근 점수를 기준으로 한 번 더 말해 보세요.';
}

export default function ReviewScreen() {
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gradeError, setGradeError] = useState<string | null>(null);
  const reviewQuery = useReviewToday();
  const { data: reviewToday } = reviewQuery;
  const updateReview = useUpdateReview();
  const reviewQueue = reviewToday?.items ?? (USE_MOCK ? mockReviewQueue : []);
  const current = reviewQueue[currentIndex];
  const recentSessionsQuery = useRecentSessions(5);
  const sessionsQuery = useSessions(current?.expressionId);
  const latestSession = sessionsQuery.data?.items[0];
  const tts = useTts();
  const bottomContentPadding = 168 + Math.max(insets.bottom, 48);

  async function handleGrade(grade: ReviewGrade) {
    if (!current || updateReview.isPending) return;

    setGradeError(null);
    try {
      await updateReview.mutateAsync({ item: current, grade });
      setCurrentIndex((index) => index + 1);
    } catch {
      setGradeError('복습 결과를 저장하지 못했어요. 다시 시도해 주세요.');
    }
  }

  if (!reviewToday && reviewQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenState loading title="복습 큐를 불러오는 중" message="오늘 복습할 표현을 확인하고 있어요." />
      </SafeAreaView>
    );
  }

  if (reviewQuery.isError) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenState
          title="복습 큐를 불러오지 못했어요"
          message="백엔드 연결을 확인한 뒤 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() => reviewQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  if (!current) {
    const recentSession = recentSessionsQuery.data?.items[0];
    if (recentSession) {
      const tone = scoreTone(recentSession.totalScore ?? recentSession.pronScore);
      return (
        <SafeAreaView style={styles.safe}>
          <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomContentPadding }]} showsVerticalScrollIndicator={false}>
            <View style={styles.header}>
              <SectionLabel>복습 세션</SectionLabel>
              <Text style={styles.mono}>최근 학습</Text>
            </View>
            <View style={styles.section}>
              <Card style={styles.flashCard} padding={18}>
                <View style={styles.cardMeta}>
                  <Chip color={tone.color} bg={tone.bg} style={styles.scoreChip}>
                    최근 {Math.round(recentSession.totalScore ?? recentSession.pronScore)}점
                  </Chip>
                  <Text style={styles.lastStudied}>{relativeDateLabel(recentSession.createdAt)}</Text>
                </View>
                <Text style={styles.situationKo}>오늘 복습 없음</Text>
                <Text style={styles.textEn}>{recentSession.expressionId}</Text>
                <Text style={styles.textKo}>새 학습을 마치면 낮은 점수 표현이 복습 큐에 자동으로 들어와요.</Text>
                <View style={styles.mistakeBox}>
                  <Text style={styles.mistakeLabel}>최근 학습 데이터</Text>
                  <Text style={styles.mistakeText}>{reviewFocus(recentSession)}</Text>
                </View>
              </Card>
            </View>
            <View style={styles.section}>
              <Pressable
                style={({ pressed }) => [styles.recordCta, pressed && { opacity: 0.82 }]}
                onPress={() => router.push(`/shadowing/${recentSession.expressionId}`)}
              >
                <MicIcon color={C.paper} size={20} />
                <Text style={styles.recordCtaText}>최근 표현 다시 녹음</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      );
    }

    return (
      <SafeAreaView style={styles.safe}>
        <ScreenState
          loading={recentSessionsQuery.isLoading}
          title="오늘 복습 완료!"
          message={recentSessionsQuery.isLoading ? '최근 학습 기록을 확인하고 있어요.' : '모든 복습 표현을 완료했어요.'}
        />
      </SafeAreaView>
    );
  }

  const gradeOptions: Array<{ grade: ReviewGrade; label: string; style: object }> = [
    { grade: 'hard', label: '어려워', style: styles.gradeBtnHard },
    { grade: 'ok', label: '괜찮아', style: styles.gradeBtnOk },
    { grade: 'easy', label: '쉬워', style: styles.gradeBtnEasy },
  ];

  const gradeIntervals = gradeOptions.reduce<Record<ReviewGrade, number>>((acc, option) => {
    acc[option.grade] = calculateSm2({
      score: SCORE_BY_GRADE[option.grade],
      repetition: current.repetition,
      interval: current.interval,
      ef: current.ef,
    }).interval;
    return acc;
  }, {} as Record<ReviewGrade, number>);
  const lastScore = latestSession?.totalScore ?? current.lastScore;
  const tone = scoreTone(lastScore);
  const lastStudied = relativeDateLabel(latestSession?.createdAt);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: bottomContentPadding }]} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <SectionLabel>복습 세션</SectionLabel>
          <Text style={styles.mono}>{currentIndex + 1}/{reviewQueue.length} · SM-2</Text>
        </View>

        {/* Progress bar */}
        <View style={styles.progressWrap}>
          {reviewQueue.map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressSeg,
                i < currentIndex && styles.progressDone,
                i === currentIndex && styles.progressCurrent,
                i > currentIndex && styles.progressPending,
              ]}
            />
          ))}
        </View>

        {/* Flash card */}
        <View style={styles.section}>
          <Card style={styles.flashCard} padding={18}>
            <View style={styles.cardMeta}>
              <Chip color={tone.color} bg={tone.bg} style={styles.scoreChip}>
                최근 {Math.round(lastScore ?? 0)}점
              </Chip>
              <Text style={styles.lastStudied}>{sessionsQuery.isLoading ? '최근 학습 확인 중' : lastStudied}</Text>
            </View>

            <Text style={styles.situationKo}>{current.expression.situationKo}</Text>
            <Text style={styles.textEn}>{current.expression.textEn}</Text>
            <Text style={styles.textKo}>{current.expression.textKo}</Text>

            {/* Mini player */}
            <View style={styles.miniPlayer}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="복습 문장 듣기"
                style={({ pressed }) => [styles.playBtn, tts.isPlaying && styles.playBtnActive, pressed && { opacity: 0.75 }]}
                onPress={() => tts.playText(current.expression.textEn)}
                disabled={tts.loading}
              >
                <PlayIcon color={C.ink} size={16} />
              </Pressable>
              <MiniWaveform compact activeBars={tts.isPlaying ? 20 : 6} />
              <Text style={styles.playerTime}>{tts.loading ? '준비 중' : tts.isPlaying ? '재생 중' : '듣기'}</Text>
            </View>

            {/* Last mistake */}
            <View style={styles.mistakeBox}>
              <Text style={styles.mistakeLabel}>복습 포인트</Text>
              <Text style={styles.mistakeText}>{reviewFocus(latestSession)}</Text>
            </View>
          </Card>
        </View>

        {/* Grade buttons */}
        <View style={styles.gradeRow}>
          {gradeOptions.map((option) => (
            <Pressable
              key={option.grade}
              style={({ pressed }) => [
                styles.gradeBtn,
                option.style,
                (pressed || updateReview.isPending) && { opacity: 0.8 },
              ]}
              onPress={() => handleGrade(option.grade)}
              disabled={updateReview.isPending}
            >
              <Text style={styles.gradeLabel}>{option.label}</Text>
              <Text style={styles.gradeSub}>
                {updateReview.isPending ? '저장 중' : intervalLabel(gradeIntervals[option.grade])}
              </Text>
            </Pressable>
          ))}
        </View>

        {gradeError && (
          <View style={styles.section}>
            <Text style={styles.gradeError}>{gradeError}</Text>
          </View>
        )}

        {/* Re-record CTA */}
        <View style={styles.section}>
          <Pressable
            style={({ pressed }) => [styles.recordCta, pressed && { opacity: 0.82 }]}
            onPress={() => router.push(`/shadowing/${current.expressionId}`)}
          >
            <MicIcon color={C.paper} size={20} />
            <Text style={styles.recordCtaText}>다시 녹음해서 점수 갱신</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper },
  scroll: {},
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.screenH, paddingTop: 8, paddingBottom: 12,
  },
  mono: { fontSize: 11, color: C.muted, fontFamily: 'IBMPlexMono' },

  progressWrap: {
    flexDirection: 'row', gap: 4, paddingHorizontal: spacing.screenH, marginBottom: 16,
  },
  progressSeg: { flex: 1, height: 4, borderRadius: 2 },
  progressDone: { backgroundColor: C.ink },
  progressCurrent: { backgroundColor: C.accent },
  progressPending: { backgroundColor: C.line },

  section: { paddingHorizontal: spacing.screenH, marginBottom: 12 },

  flashCard: { borderRadius: 22, gap: 14 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  scoreChip: { paddingVertical: 3, paddingHorizontal: 8 },
  lastStudied: { fontSize: 10, color: C.muted, fontFamily: 'IBMPlexMono' },

  situationKo: { fontSize: 12, color: C.muted, fontWeight: '500' },
  textEn: { fontSize: 18, fontWeight: '600', color: C.ink, lineHeight: 26, letterSpacing: -0.3 },
  textKo: { fontSize: 13, color: C.muted2 },

  miniPlayer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, backgroundColor: C.paper2, borderRadius: 12,
  },
  playBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: C.card, alignItems: 'center', justifyContent: 'center',
    borderWidth: 0.5, borderColor: C.line,
  },
  playBtnActive: { backgroundColor: C.sageSoft, borderColor: C.sage },
  playerTime: { fontSize: 10, color: C.muted, fontFamily: 'IBMPlexMono' },

  mistakeBox: {
    padding: 12, backgroundColor: C.goldSoft, borderRadius: 12,
    borderWidth: 0.5, borderColor: C.gold + '40',
  },
  mistakeLabel: { fontSize: 11, fontWeight: '600', color: C.gold, marginBottom: 4 },
  mistakeText: { fontSize: 13, color: C.ink2, lineHeight: 18 },

  gradeRow: {
    flexDirection: 'row', gap: 8, paddingHorizontal: spacing.screenH, marginBottom: 12,
  },
  gradeBtn: {
    flex: 1, padding: 14, borderRadius: 16, alignItems: 'center', gap: 2,
  },
  gradeBtnHard: { backgroundColor: '#FDF1EE' },
  gradeBtnOk: { backgroundColor: C.goldSoft },
  gradeBtnEasy: { backgroundColor: C.sageSoft },
  gradeLabel: { fontSize: 14, fontWeight: '700', color: C.ink },
  gradeSub: { fontSize: 10, color: C.muted, fontFamily: 'IBMPlexMono' },
  gradeError: {
    color: C.rose,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },

  recordCta: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    padding: 16, backgroundColor: C.ink, borderRadius: 16,
  },
  recordCtaText: { fontSize: 14, fontWeight: '600', color: C.paper },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyEmoji: { fontSize: 40 },
  emptyTitle: { fontSize: 22, fontWeight: '700' },
  emptySub: { fontSize: 14, color: C.muted },
});
