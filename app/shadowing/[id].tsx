import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { C, spacing } from '@/lib/theme';
import { Card } from '@/components/common/Card';
import { Chip } from '@/components/common/Chip';
import { SectionLabel } from '@/components/common/SectionLabel';
import { AudioSpeedPicker } from '@/components/common/AudioSpeedPicker';
import { PlayIcon, ChevronIcon } from '@/components/common/Icons';
import { ChunkHighlight } from '@/components/shadowing/ChunkHighlight';
import { RecordButton } from '@/components/shadowing/RecordButton';
import { mockExpressions } from '@/lib/mocks/expressions.mock';
import { useLearningStore } from '@/stores/learning.store';
import { useExpression } from '@/hooks/useLearningData';

const SPEEDS = [0.75, 1.0, 1.2] as const;
const WAVE_HEIGHTS = Array.from({ length: 40 }, (_, i) => 8 + Math.abs(Math.sin(i * 0.55)) * 20);

export default function ShadowingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: fetchedExpression } = useExpression(id);
  const expression = fetchedExpression ?? mockExpressions.find((e) => e.id === id) ?? mockExpressions[10];
  const { incrementAttempt, setCurrentExpression } = useLearningStore();

  const [speed, setSpeed] = useState<0.75 | 1.0 | 1.2>(1.0);
  const [activeChunk, setActiveChunk] = useState(0);
  const [completedChunks, setCompletedChunks] = useState<Set<number>>(new Set());
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  function markChunkDone(i: number) {
    const next = new Set(completedChunks);
    next.add(i);
    setCompletedChunks(next);
    if (i < expression.chunks.length - 1) setActiveChunk(i + 1);
  }

  function handleRecordEnd(audioUri: string) {
    incrementAttempt();
    setCurrentExpression(expression.id);
    setIsAnalyzing(true);
    router.push({ pathname: '/feedback', params: { expressionId: expression.id, audioUri } });
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

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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

            <ChunkHighlight
              chunks={expression.chunks}
              activeIndex={activeChunk}
              completedIndexes={completedChunks}
            />

            <Text style={styles.textKo}>{expression.textKo}</Text>

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
      <View style={styles.recordPanel}>
        <View style={styles.recordPanelInner}>
          <RecordButton
            onRecordStart={() => setIsAnalyzing(false)}
            onRecordEnd={handleRecordEnd}
          />
          <View style={styles.recordInfo}>
            <Text style={styles.recordStatus}>{isAnalyzing ? '분석 화면으로 이동 중...' : '준비됐어요'}</Text>
            <Text style={styles.recordGuide}>마이크를 탭해서 최대 10초 녹음</Text>
          </View>
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

  scroll: { paddingBottom: 140 },
  section: { paddingHorizontal: spacing.screenH, marginTop: 14 },

  situationCard: {
    padding: 14, backgroundColor: C.goldSoft, borderRadius: 14,
    borderLeftWidth: 3, borderLeftColor: C.gold,
    borderWidth: 0.5, borderColor: C.gold + '30',
  },
  situationText: { fontSize: 14, color: C.ink2, lineHeight: 20 },

  targetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  speedBadge: {
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: C.paper2, borderRadius: 999,
  },
  speedText: { fontSize: 11, fontWeight: '600', color: C.ink2, fontFamily: 'IBMPlexMonoSemiBold' },

  textKo: { fontSize: 13, color: C.muted, marginBottom: 14 },

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
    paddingBottom: 36, paddingTop: 16, paddingHorizontal: spacing.screenH,
    backgroundColor: 'rgba(245,240,230,0.95)',
    borderTopWidth: 0.5, borderTopColor: C.line,
  },
  recordPanelInner: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  recordInfo: { flex: 1 },
  recordStatus: { fontSize: 15, fontWeight: '700', color: C.ink },
  recordGuide: { fontSize: 12, color: C.muted, marginTop: 2 },
});
