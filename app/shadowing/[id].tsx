import React, { useState } from 'react';
import {
  Alert, View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, spacing } from '@/lib/theme';
import { Card } from '@/components/common/Card';
import { Chip } from '@/components/common/Chip';
import { SectionLabel } from '@/components/common/SectionLabel';
import { ScreenState } from '@/components/common/ScreenState';
import { AudioSpeedPicker } from '@/components/common/AudioSpeedPicker';
import { PlayIcon, ChevronIcon } from '@/components/common/Icons';
import { ChunkHighlight } from '@/components/shadowing/ChunkHighlight';
import { RecordButton } from '@/components/shadowing/RecordButton';
import { mockExpressions } from '@/lib/mocks/expressions.mock';
import { getApiErrorMessage, USE_MOCK } from '@/lib/api';
import { useLearningStore } from '@/stores/learning.store';
import { useExpression } from '@/hooks/useLearningData';
import { useTts } from '@/hooks/useTts';

const SPEEDS = [0.75, 1.0, 1.2] as const;
const WAVE_HEIGHTS = Array.from({ length: 40 }, (_, i) => 8 + Math.abs(Math.sin(i * 0.55)) * 20);

export default function ShadowingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const expressionQuery = useExpression(id);
  const { data: fetchedExpression } = expressionQuery;
  const expression = fetchedExpression ?? (USE_MOCK ? mockExpressions.find((e) => e.id === id) ?? mockExpressions[10] : undefined);
  const { incrementAttempt, setCurrentExpression } = useLearningStore();
  const { playText, loading: ttsLoading, isPlaying } = useTts();

  const [speed, setSpeed] = useState<0.75 | 1.0 | 1.2>(1.0);
  const [activeChunk, setActiveChunk] = useState(0);
  const [completedChunks, setCompletedChunks] = useState<Set<number>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  if (!expression && expressionQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenState loading title="표현을 불러오는 중" message="쉐도잉 문장을 준비하고 있어요." />
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

  const readyExpression = expression;

  function markChunkDone(i: number) {
    const next = new Set(completedChunks);
    next.add(i);
    setCompletedChunks(next);
    if (i < readyExpression.chunks.length - 1) setActiveChunk(i + 1);
  }

  function handleRecordEnd(audioUri: string) {
    incrementAttempt();
    setCurrentExpression(readyExpression.id);
    setIsAnalyzing(true);
    router.push({ pathname: '/feedback', params: { expressionId: readyExpression.id, audioUri } });
  }

  async function handlePlayTts() {
    try {
      await playText(readyExpression.textEn, speed);
    } catch (error) {
      Alert.alert('음성을 재생하지 못했어요', getApiErrorMessage(error));
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronIcon dir="left" color={C.ink} size={20} />
        </Pressable>
        <Text style={styles.breadcrumb}>{expression.situationKo}</Text>
        <Text style={styles.progress}>{activeChunk + 1}/{expression.chunks.length}</Text>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: 176 + Math.max(insets.bottom, 24) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Situation card */}
        <View style={styles.section}>
          <View style={styles.situationCard}>
            <SectionLabel style={{ marginBottom: 6 }}>상황</SectionLabel>
            <Text style={styles.situationText}>{expression.situationKo}</Text>
          </View>
        </View>

        {/* Target sentence card */}
        <View style={styles.section}>
          <Card padding={16}>
            <View style={styles.targetHeader}>
              <Chip color={C.gold} bg={C.goldSoft}>Target · Level {expression.level}</Chip>
              <View style={styles.targetControls}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="문장 듣기"
                  accessibilityState={{ busy: ttsLoading, selected: isPlaying }}
                  disabled={ttsLoading}
                  style={({ pressed }) => [
                    styles.playBtn,
                    isPlaying && styles.playBtnActive,
                    (pressed || ttsLoading) && { opacity: 0.72 },
                  ]}
                  onPress={handlePlayTts}
                >
                  <PlayIcon size={14} color={isPlaying ? C.paper : C.ink} />
                </Pressable>
                <Pressable
                  style={styles.speedBadge}
                  onPress={() => {
                    const idx = SPEEDS.indexOf(speed);
                    setSpeed(SPEEDS[(idx + 1) % SPEEDS.length]);
                  }}
                >
                  <Text style={styles.speedText}>{speed}×</Text>
                </Pressable>
              </View>
            </View>

            <ChunkHighlight
              chunks={expression.chunks}
              activeIndex={activeChunk}
              completedIndexes={completedChunks}
            />

            <Text style={styles.textKo}>{expression.textKo}</Text>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="원어민 음성 듣기"
              accessibilityState={{ busy: ttsLoading, selected: isPlaying }}
              disabled={ttsLoading}
              style={({ pressed }) => [
                styles.listenBtn,
                isPlaying && styles.listenBtnActive,
                (pressed || ttsLoading) && { opacity: 0.78 },
              ]}
              onPress={handlePlayTts}
            >
              <PlayIcon size={16} color={isPlaying ? C.paper : C.ink} />
              <Text style={[styles.listenText, isPlaying && styles.listenTextActive]}>
                {ttsLoading ? '음성 준비 중' : isPlaying ? '재생 중' : '듣기'}
              </Text>
              <Text style={[styles.listenSpeed, isPlaying && styles.listenTextActive]}>{speed}x</Text>
            </Pressable>

            {/* Waveform */}
            <View style={styles.waveformRow}>
              <Text style={styles.waveTime}>0:00</Text>
              <View style={styles.waveform}>
                {WAVE_HEIGHTS.map((height, i) => (
                  <View
                    key={i}
                    style={[
                      styles.waveBar,
                      {
                        height,
                        backgroundColor: i < 15 ? C.ink : C.line2,
                      },
                    ]}
                  />
                ))}
              </View>
              <Text style={styles.waveTime}>0:03</Text>
            </View>

            <AudioSpeedPicker speeds={SPEEDS} selected={speed} onChange={setSpeed} />
          </Card>
        </View>

        {/* Chunk progress */}
        <View style={styles.section}>
          <View style={styles.chunkProgress}>
            {expression.chunks.map((_, i) => {
              const isDone = completedChunks.has(i);
              const isActive = i === activeChunk && !isDone;
              return (
                <Pressable
                  key={i}
                  style={[
                    styles.chunkBox,
                    isDone && styles.chunkBoxDone,
                    isActive && styles.chunkBoxActive,
                    !isDone && !isActive && styles.chunkBoxPending,
                  ]}
                  onPress={() => isDone ? null : markChunkDone(i)}
                >
                  {isDone ? (
                    <Text style={styles.chunkBoxCheck}>✓</Text>
                  ) : (
                    <Text style={[styles.chunkBoxLabel, isActive && styles.chunkBoxLabelActive]}>
                      {i + 1}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Recording panel */}
      <View style={[styles.recordPanel, { paddingBottom: 14 + Math.max(insets.bottom, 18) }]}>
        <View style={styles.recordPanelHeader}>
          <View>
            <Text style={styles.recordStatus}>{isAnalyzing ? '분석 화면으로 이동 중...' : '따라 말할 준비'}</Text>
            <Text style={styles.recordGuide}>듣고 나서 같은 문장을 녹음하세요.</Text>
          </View>
          <Text style={styles.recordLimit}>MAX 10s</Text>
        </View>
        <View style={styles.recordPanelInner}>
          <RecordButton
            onRecordStart={() => setIsAnalyzing(false)}
            onRecordEnd={handleRecordEnd}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screenH, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: C.line,
  },
  backBtn: { padding: 4 },
  breadcrumb: { fontSize: 14, fontWeight: '600', color: C.ink, flex: 1, textAlign: 'center' },
  progress: { fontSize: 12, color: C.muted, fontFamily: 'IBMPlexMono', width: 30, textAlign: 'right' },

  scroll: { paddingBottom: 200 },
  section: { paddingHorizontal: spacing.screenH, marginTop: 14 },

  situationCard: {
    padding: 14, backgroundColor: C.goldSoft, borderRadius: 14,
    borderLeftWidth: 3, borderLeftColor: C.gold,
    borderWidth: 0.5, borderColor: C.gold + '30',
  },
  situationText: { fontSize: 14, color: C.ink2, lineHeight: 20 },

  targetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  targetControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.paper2,
    borderWidth: 0.5,
    borderColor: C.line,
  },
  playBtnActive: { backgroundColor: C.ink, borderColor: C.ink },
  speedBadge: {
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: C.paper2, borderRadius: 999,
  },
  speedText: { fontSize: 11, fontWeight: '600', color: C.ink2, fontFamily: 'IBMPlexMonoSemiBold' },

  textKo: { fontSize: 13, color: C.muted, marginBottom: 12 },
  listenBtn: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 14,
    borderRadius: 12,
    backgroundColor: C.paper2,
    borderWidth: 0.5,
    borderColor: C.line,
  },
  listenBtnActive: { backgroundColor: C.ink, borderColor: C.ink },
  listenText: { fontSize: 13, fontWeight: '800', color: C.ink, fontFamily: 'InterBold' },
  listenTextActive: { color: C.paper },
  listenSpeed: {
    marginLeft: 4,
    fontSize: 10,
    color: C.muted,
    fontFamily: 'IBMPlexMonoSemiBold',
  },

  waveformRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 14 },
  waveTime: { fontSize: 9, color: C.muted, fontFamily: 'IBMPlexMono' },
  waveform: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2 },
  waveBar: { flex: 1, borderRadius: 1 },

  chunkProgress: { flexDirection: 'row', gap: 8 },
  chunkBox: {
    flex: 1, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  chunkBoxDone: { backgroundColor: C.sageSoft },
  chunkBoxActive: { backgroundColor: C.accentSoft, borderWidth: 1.5, borderColor: C.accent },
  chunkBoxPending: { backgroundColor: C.paper2 },
  chunkBoxCheck: { fontSize: 16, color: C.sage },
  chunkBoxLabel: { fontSize: 14, fontWeight: '700', color: C.muted },
  chunkBoxLabelActive: { color: C.accent },

  recordPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingTop: 14, paddingHorizontal: spacing.screenH,
    backgroundColor: '#101E3F',
    borderTopWidth: 1, borderTopColor: '#264A96',
  },
  recordPanelHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 10,
  },
  recordPanelInner: { flexDirection: 'row', alignItems: 'center' },
  recordStatus: { fontSize: 15, fontWeight: '700', color: C.paper },
  recordGuide: { fontSize: 12, color: 'rgba(245,240,230,0.72)', marginTop: 2 },
  recordLimit: { fontSize: 10, color: 'rgba(245,240,230,0.72)', fontFamily: 'IBMPlexMonoSemiBold' },
});
