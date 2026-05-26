import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, spacing } from '@/lib/theme';
import { Card } from '@/components/common/Card';
import { SectionLabel } from '@/components/common/SectionLabel';
import { ScreenState } from '@/components/common/ScreenState';
import { ScoreRing } from '@/components/common/ScoreRing';
import { ChevronIcon } from '@/components/common/Icons';
import { DiffHighlight, WordResult } from '@/components/feedback/DiffHighlight';
import { FeedbackCard } from '@/components/feedback/FeedbackCard';
import { ScoreBar } from '@/components/feedback/ScoreBar';
import { mockExpressions } from '@/lib/mocks/expressions.mock';
import { getApiErrorMessage, USE_MOCK } from '@/lib/api';
import { MOCK_RECORDING_URI } from '@/lib/recording';
import { useAzurePronunciation, PronunciationResult } from '@/hooks/useAzurePronunciation';
import { GptFeedbackResult, useGptFeedback } from '@/hooks/useGptFeedback';
import { useCreateSession, useExpression, useExpressions } from '@/hooks/useLearningData';

interface SubScore { label: string; value: number }

const NEXT_ACTION_COLOR = '#0B5FFF';
const NEXT_ACTION_BORDER = '#003EA8';
const NEXT_ACTION_DISABLED = '#7F8AA3';

function getWordStatus(word: PronunciationResult['words'][number]): WordResult['status'] {
  if (word.errorType !== 'None' || word.accuracyScore < 60) return 'bad';
  if (word.accuracyScore < 78) return 'warn';
  return 'ok';
}

function getComment(score: number) {
  if (score >= 85) return '아주 안정적이에요. 이 톤 그대로 실전에서 써도 좋아요.';
  if (score >= 70) return '좋은 시도예요. 한 곳만 다듬으면 더 자연스러워져요.';
  return '핵심 단어부터 다시 잡아볼게요. 천천히 청크별로 재도전해요.';
}

export default function FeedbackScreen() {
  const { expressionId, audioUri } = useLocalSearchParams<{ expressionId?: string; audioUri?: string }>();
  const insets = useSafeAreaInsets();
  const expressionQuery = useExpression(expressionId);
  const { data: fetchedExpression } = expressionQuery;
  const expression = fetchedExpression ?? (USE_MOCK ? mockExpressions.find((e) => e.id === expressionId) ?? mockExpressions[3] : undefined);
  const expressionsQuery = useExpressions(expression ? { limit: 100 } : {});
  const pronunciation = useAzurePronunciation();
  const coach = useGptFeedback();
  const createSession = useCreateSession();

  const [analysisRun, setAnalysisRun] = useState(0);
  const [pronResult, setPronResult] = useState<PronunciationResult | null>(null);
  const [coachResult, setCoachResult] = useState<GptFeedbackResult | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function runAnalysis() {
      if (!expression) return;

      setPronResult(null);
      setCoachResult(null);
      pronunciation.reset();
      coach.reset();
      createSession.reset();

      try {
        const nextPronResult = await pronunciation.mutateAsync({
          audioUri: audioUri ?? MOCK_RECORDING_URI,
          referenceText: expression.textEn,
          expressionId: expression.id,
        });
        if (cancelled) return;
        setPronResult(nextPronResult);

        const nextCoachResult = await coach.mutateAsync({
          targetSentence: expression.textEn,
          pronResult: nextPronResult,
        });
        if (cancelled) return;
        setCoachResult(nextCoachResult);

        await createSession.mutateAsync({
          expressionId: expression.id,
          pronResult: nextPronResult,
          feedback: nextCoachResult,
        });
      } catch {
        // Mutation state renders the retry UI below.
      }
    }

    runAnalysis();

    return () => {
      cancelled = true;
    };
  }, [analysisRun, audioUri, expression?.id, expression?.textEn]);

  const isAnalyzing = pronunciation.isPending || coach.isPending || createSession.isPending;
  const error = pronunciation.error ?? coach.error ?? createSession.error;
  const subScores: SubScore[] = useMemo(() => {
    if (!pronResult) return [];

    return [
      { label: '발음', value: pronResult.accuracyScore },
      { label: '유창성', value: pronResult.fluencyScore },
      { label: '억양', value: pronResult.prosodyScore },
      { label: '완성도', value: pronResult.completenessScore },
    ];
  }, [pronResult]);
  const words = useMemo<WordResult[]>(() => (
    pronResult?.words.map((word) => ({ word: word.word, status: getWordStatus(word) })) ?? []
  ), [pronResult]);
  const focusWord = words.find((word) => word.status === 'bad')?.word
    ?? words.find((word) => word.status === 'warn')?.word
    ?? expression?.chunks[0]?.split(' ')[0]
    ?? 'focus';
  const nextExpression = useMemo(() => {
    if (!expression) return undefined;
    const expressions = expressionsQuery.data?.items ?? (USE_MOCK ? mockExpressions : []);
    const sameCategory = expressions.filter((item) => item.category === expression.category);
    const candidates = sameCategory.length > 1 ? sameCategory : expressions;
    const currentIndex = candidates.findIndex((item) => item.id === expression.id);
    if (currentIndex < 0) return candidates.find((item) => item.id !== expression.id);
    return candidates[(currentIndex + 1) % candidates.length];
  }, [expression, expressionsQuery.data?.items]);
  const canGoNext = Boolean(nextExpression && nextExpression.id !== expression?.id);

  function goToNextExpression() {
    if (expressionsQuery.isLoading || expressionsQuery.isFetching) return;

    if (canGoNext && nextExpression) {
      router.replace(`/shadowing/${nextExpression.id}`);
      return;
    }
    router.replace('/(tabs)/categories');
  }

  if (!expression && expressionQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenState loading title="표현을 불러오는 중" message="분석할 쉐도잉 문장을 확인하고 있어요." />
      </SafeAreaView>
    );
  }

  if (!expression || expressionQuery.isError) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenState
          title="표현을 불러오지 못했어요"
          message={expressionQuery.error ? getApiErrorMessage(expressionQuery.error) : '백엔드 연결을 확인한 뒤 다시 시도해 주세요.'}
          actionLabel="다시 시도"
          onAction={() => expressionQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronIcon dir="left" color={C.ink} size={20} />
        </Pressable>
        <Text style={styles.title} numberOfLines={1}>{expression.situationKo}</Text>
        {pronResult ? (
          <Pressable
            style={({ pressed }) => [
              styles.headerNextBtn,
              (expressionsQuery.isLoading || expressionsQuery.isFetching) && styles.headerNextBtnDisabled,
              pressed && { opacity: 0.8 },
            ]}
            onPress={goToNextExpression}
            disabled={expressionsQuery.isLoading || expressionsQuery.isFetching}
          >
            <Text style={styles.headerNextText}>{canGoNext ? '다음' : '목록'}</Text>
          </Pressable>
        ) : (
          <Text style={styles.engineLabel}>{createSession.isSuccess ? '저장됨' : 'AZURE · GPT-4o'}</Text>
        )}
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 128 + Math.max(insets.bottom, 24) }]}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <View style={styles.section}>
            <Card padding={16}>
              <SectionLabel style={{ marginBottom: 8 }}>분석 실패</SectionLabel>
              <Text style={styles.errorText}>{getApiErrorMessage(error)}</Text>
              <Pressable
                style={({ pressed }) => [styles.retryAnalysisBtn, pressed && { opacity: 0.8 }]}
                onPress={() => setAnalysisRun((run) => run + 1)}
              >
                <Text style={styles.retryAnalysisText}>분석 다시 실행</Text>
              </Pressable>
            </Card>
          </View>
        )}

        {!pronResult && !error && (
          <View style={styles.section}>
            <View style={styles.loadingCard}>
              <ActivityIndicator color={C.accent} />
              <Text style={styles.loadingTitle}>발음과 표현을 분석 중입니다</Text>
              <Text style={styles.loadingText}>Azure 점수 계산 후 GPT 코치 피드백을 이어서 생성합니다.</Text>
            </View>
          </View>
        )}

        {/* Score hero — dark card */}
        {pronResult && (
        <View style={styles.section}>
          <View style={styles.heroCard}>
            <View style={styles.heroTop}>
              <ScoreRing value={pronResult.totalScore} size={88} strokeWidth={7} color={C.sageSoft} />
              <View style={styles.heroInfo}>
                <Text style={styles.heroLabel}>총점</Text>
                <Text style={styles.heroComment}>
                  <Text style={styles.heroCommentSerif}>{pronResult.totalScore >= 70 ? '좋은 시도' : '재도전 포인트'}</Text>
                  {'\n'}
                  {getComment(pronResult.totalScore)}
                </Text>
              </View>
            </View>

            {/* 4 sub-scores grid */}
            <View style={styles.subGrid}>
              {subScores.map((s) => (
                <ScoreBar key={s.label} label={s.label} value={s.value} />
              ))}
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.inlineNextBtn,
                (expressionsQuery.isLoading || expressionsQuery.isFetching) && styles.nextBtnDisabled,
                pressed && { opacity: 0.86, transform: [{ scale: 0.99 }] },
              ]}
              onPress={goToNextExpression}
              disabled={expressionsQuery.isLoading || expressionsQuery.isFetching}
            >
              <Text style={styles.nextText}>
                {expressionsQuery.isLoading || expressionsQuery.isFetching
                  ? '다음 표현 준비 중'
                  : canGoNext ? '다음 표현으로 이동 →' : '카테고리에서 더 보기 →'}
              </Text>
            </Pressable>
          </View>
        </View>
        )}

        {/* Word-level breakdown */}
        {pronResult && (
        <View style={styles.section}>
          <Card padding={16}>
            <SectionLabel style={{ marginBottom: 8 }}>단어별 인식</SectionLabel>
            <DiffHighlight words={words} />
          </Card>
        </View>
        )}

        {/* GPT coach feedback */}
        {coachResult && (
        <View style={styles.section}>
          <View style={styles.coachLabelRow}>
            <View style={styles.aiTag}><Text style={styles.aiTagText}>AI</Text></View>
            <SectionLabel>코치 피드백</SectionLabel>
          </View>
          <FeedbackCard issue={coachResult.issue} alternatives={coachResult.alternatives} focusWord={focusWord} />
        </View>
        )}

        {isAnalyzing && pronResult && (
          <View style={styles.savingRow}>
            <ActivityIndicator color={C.muted} size="small" />
            <Text style={styles.savingText}>세션 저장 중</Text>
          </View>
        )}
      </ScrollView>

      {pronResult && (
        <View style={[styles.actionDock, { paddingBottom: 14 + Math.max(insets.bottom, 18) }]}>
          <Text style={styles.dockEyebrow}>다음 학습</Text>
          <Pressable
            style={({ pressed }) => [
              styles.nextBtn,
              (expressionsQuery.isLoading || expressionsQuery.isFetching) && styles.nextBtnDisabled,
              {
                backgroundColor: expressionsQuery.isLoading || expressionsQuery.isFetching
                  ? NEXT_ACTION_DISABLED
                  : NEXT_ACTION_COLOR,
                borderColor: expressionsQuery.isLoading || expressionsQuery.isFetching
                  ? NEXT_ACTION_DISABLED
                  : NEXT_ACTION_BORDER,
              },
              pressed && { opacity: 0.8, transform: [{ scale: 0.98 }] },
            ]}
            onPress={goToNextExpression}
            disabled={expressionsQuery.isLoading || expressionsQuery.isFetching}
          >
            <Text style={styles.nextText}>
              {expressionsQuery.isLoading || expressionsQuery.isFetching
                ? '다음 표현 준비 중'
                : canGoNext ? '다음 표현 →' : '카테고리 보기 →'}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper },
  topBar: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: spacing.screenH, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: C.line,
  },
  backBtn: { width: 40, padding: 4 },
  title: { flex: 1, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  engineLabel: {
    width: 76,
    paddingRight: 32,
    fontSize: 11,
    color: C.muted,
    fontFamily: 'IBMPlexMono',
    textAlign: 'right',
  },
  headerNextBtn: {
    width: 76,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: NEXT_ACTION_COLOR,
    borderWidth: 1,
    borderColor: NEXT_ACTION_BORDER,
  },
  headerNextBtnDisabled: { backgroundColor: NEXT_ACTION_DISABLED, borderColor: NEXT_ACTION_DISABLED },
  headerNextText: { fontSize: 12, fontWeight: '800', color: C.paper },

  scroll: { paddingTop: 14 },
  section: { paddingHorizontal: spacing.screenH, marginTop: 0, marginBottom: 14 },

  loadingCard: {
    alignItems: 'center',
    gap: 8,
    padding: 24,
    backgroundColor: C.card,
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: C.line,
  },
  loadingTitle: { fontSize: 15, fontWeight: '700', color: C.ink },
  loadingText: { fontSize: 12, color: C.muted, textAlign: 'center', lineHeight: 18 },
  errorText: { fontSize: 12, color: C.ink2, lineHeight: 18 },
  retryAnalysisBtn: {
    marginTop: 12,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: C.ink,
    alignItems: 'center',
  },
  retryAnalysisText: { fontSize: 13, fontWeight: '700', color: C.paper },

  // Hero dark card
  heroCard: {
    backgroundColor: C.ink, borderRadius: 22, padding: 18,
  },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 16 },
  heroInfo: { flex: 1 },
  heroLabel: {
    fontSize: 10, color: 'rgba(245,240,230,0.5)', fontWeight: '700', letterSpacing: 0.8,
  },
  heroComment: { fontSize: 13, fontWeight: '600', color: C.paper, marginTop: 4, lineHeight: 19 },
  heroCommentSerif: { fontFamily: 'InstrumentSerifItalic', fontWeight: '400', fontStyle: 'italic' },

  subGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  // Coach
  coachLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  aiTag: {
    width: 16, height: 16, borderRadius: 4, backgroundColor: C.ink,
    alignItems: 'center', justifyContent: 'center',
  },
  aiTagText: { fontSize: 9, fontWeight: '800', color: C.paper },

  // Actions
  actionDock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    gap: 10,
    paddingTop: 12,
    paddingHorizontal: spacing.screenH,
    backgroundColor: '#101E3F',
    borderTopWidth: 1,
    borderTopColor: '#264A96',
    zIndex: 20,
    elevation: 20,
  },
  dockEyebrow: {
    marginBottom: 8,
    fontSize: 11,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.72)',
    fontFamily: 'IBMPlexMonoSemiBold',
  },
  inlineNextBtn: {
    minHeight: 54,
    marginTop: 16,
    paddingVertical: 15,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NEXT_ACTION_COLOR,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: NEXT_ACTION_BORDER,
  },
  nextBtn: {
    minHeight: 62,
    paddingVertical: 18,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NEXT_ACTION_COLOR,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: NEXT_ACTION_BORDER,
    shadowColor: '#001B52',
    shadowOpacity: 0.24,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 7 },
    elevation: 10,
  },
  nextBtnDisabled: { backgroundColor: NEXT_ACTION_DISABLED, borderColor: NEXT_ACTION_DISABLED },
  nextText: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', fontFamily: 'InterBold' },
  savingRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 12 },
  savingText: { fontSize: 11, color: C.muted, fontFamily: 'IBMPlexMono' },
});
