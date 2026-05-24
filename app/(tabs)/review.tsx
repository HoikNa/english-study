import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView,
} from 'react-native';
import { C, spacing } from '@/lib/theme';
import { Card } from '@/components/common/Card';
import { SectionLabel } from '@/components/common/SectionLabel';
import { Chip } from '@/components/common/Chip';
import { MicIcon, PlayIcon } from '@/components/common/Icons';
import { MiniWaveform } from '@/components/common/MiniWaveform';
import { mockReviewQueue } from '@/lib/mocks/expressions.mock';
import { ReviewGrade } from '@/types';
import { useReviewToday, useUpdateReview } from '@/hooks/useLearningData';

export default function ReviewScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { data: reviewToday } = useReviewToday();
  const updateReview = useUpdateReview();
  const reviewQueue = reviewToday?.items ?? mockReviewQueue;
  const current = reviewQueue[currentIndex];

  function handleGrade(grade: ReviewGrade) {
    if (!current || updateReview.isPending) return;
    updateReview.mutate({ item: current, grade });

    setCurrentIndex(currentIndex + 1);
  }

  if (!current) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.empty}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>오늘 복습 완료!</Text>
          <Text style={styles.emptySub}>모든 복습 표현을 완료했어요.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <SectionLabel>복습 세션</SectionLabel>
          <Text style={styles.mono}>SM-2</Text>
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
              <Chip color={C.rose} bg={C.accentSoft} style={styles.scoreChip}>
                전 회차 {current.lastScore}점
              </Chip>
            <Text style={styles.lastStudied}>5일 전 학습</Text>
            </View>

            <Text style={styles.situationKo}>{current.expression.situationKo}</Text>
            <Text style={styles.textEn}>{current.expression.textEn}</Text>
            <Text style={styles.textKo}>{current.expression.textKo}</Text>

            {/* Mini player */}
            <View style={styles.miniPlayer}>
              <Pressable style={styles.playBtn}>
                <PlayIcon color={C.ink} size={16} />
              </Pressable>
              <MiniWaveform compact />
              <Text style={styles.playerTime}>0:03</Text>
            </View>

            {/* Last mistake */}
            <View style={styles.mistakeBox}>
            <Text style={styles.mistakeLabel}>💡 지난 실수</Text>
              <Text style={styles.mistakeText}>
                강세: <Text style={styles.monoEmphasis}>e-LAB-or-ate</Text> — 두 번째 음절을 강하게
              </Text>
            </View>
          </Card>
        </View>

        {/* Grade buttons */}
        <View style={styles.gradeRow}>
          <Pressable
            style={({ pressed }) => [styles.gradeBtn, styles.gradeBtnHard, pressed && { opacity: 0.8 }]}
            onPress={() => handleGrade('hard')}
            disabled={updateReview.isPending}
          >
            <Text style={styles.gradeLabel}>어려워</Text>
            <Text style={styles.gradeSub}>내일 다시</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.gradeBtn, styles.gradeBtnOk, pressed && { opacity: 0.8 }]}
            onPress={() => handleGrade('ok')}
            disabled={updateReview.isPending}
          >
            <Text style={styles.gradeLabel}>괜찮아</Text>
            <Text style={styles.gradeSub}>3일 뒤</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.gradeBtn, styles.gradeBtnEasy, pressed && { opacity: 0.8 }]}
            onPress={() => handleGrade('easy')}
            disabled={updateReview.isPending}
          >
            <Text style={styles.gradeLabel}>쉬워</Text>
            <Text style={styles.gradeSub}>7일 뒤</Text>
          </Pressable>
        </View>

        {/* Re-record CTA */}
        <View style={styles.section}>
          <Pressable style={styles.recordCta}>
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
  scroll: { paddingBottom: 100 },
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
  playerTime: { fontSize: 10, color: C.muted, fontFamily: 'IBMPlexMono' },

  mistakeBox: {
    padding: 12, backgroundColor: C.goldSoft, borderRadius: 12,
    borderWidth: 0.5, borderColor: C.gold + '40',
  },
  mistakeLabel: { fontSize: 11, fontWeight: '600', color: C.gold, marginBottom: 4 },
  mistakeText: { fontSize: 13, color: C.ink2, lineHeight: 18 },
  monoEmphasis: { fontFamily: 'IBMPlexMonoSemiBold', color: C.gold },

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
