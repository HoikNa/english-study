import React, { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, spacing } from '@/lib/theme';
import { ChevronIcon, PlayIcon } from '@/components/common/Icons';
import { ScreenState } from '@/components/common/ScreenState';
import { getBlock, SOUND_BLOCK_CATEGORY_LABELS, SOUND_BLOCK_SUBCATEGORY_LABELS } from '@/lib/data/sound_blocks';
import blockAudioMap from '@/lib/data/sound_block_audio.json';
import { useTts } from '@/hooks/useTts';
import { useBlockStatsStore } from '@/stores/block_stats.store';

const EXAMPLE_VOICES = ['echo', 'nova', 'shimmer', 'fable'] as const;

export default function BlockScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const block = getBlock(id ?? '');
  const tts = useTts();
  const insets = useSafeAreaInsets();
  const [playingIdx, setPlayingIdx] = useState<number | null>(null);
  const [showKo, setShowKo] = useState(true);
  const recordOpen = useBlockStatsStore((s) => s.recordOpen);
  const recordPlay = useBlockStatsStore((s) => s.recordExamplePlay);
  const examplePlayCount = useBlockStatsStore((s) =>
    block ? (s.stats[block.id]?.examplePlayCounts ?? {}) : {},
  );

  useEffect(() => {
    if (block) recordOpen(block.id);
  }, [block, recordOpen]);

  if (!block) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ChevronIcon dir="left" color={C.ink} size={20} />
          </Pressable>
          <View style={styles.topInfo}>
            <Text style={styles.topLabel}>블록</Text>
          </View>
        </View>
        <ScreenState
          title="블록을 찾지 못했어요"
          message="블록 id가 잘못됐거나 데이터가 갱신 중일 수 있어요."
          actionLabel="목록으로"
          onAction={() => router.back()}
        />
      </SafeAreaView>
    );
  }

  const handlePlay = async (idx: number) => {
    if (playingIdx === idx) {
      tts.stop();
      setPlayingIdx(null);
      return;
    }
    const example = block.examples[idx];
    if (!example) return;
    setPlayingIdx(idx);
    recordPlay(block.id, idx);
    try {
      // 사전 캐싱된 URL이 있으면 직접 재생 (즉시), 없으면 /ai/tts/generate 폴백
      const cachedUrl = (blockAudioMap as Record<string, (string | null)[]>)[block.id]?.[idx];
      if (cachedUrl) {
        await tts.playUrl(cachedUrl);
      } else {
        const voice = EXAMPLE_VOICES[idx % EXAMPLE_VOICES.length];
        await tts.playText(example.en, undefined, voice);
      }
    } finally {
      setPlayingIdx(null);
    }
  };

  const categoryLabel = SOUND_BLOCK_CATEGORY_LABELS[block.category];
  const subLabel = block.subcategory ? SOUND_BLOCK_SUBCATEGORY_LABELS[block.subcategory] : null;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronIcon dir="left" color={C.ink} size={20} />
        </Pressable>
        <View style={styles.topInfo}>
          <Text style={styles.topLabel}>{categoryLabel}{subLabel ? ` · ${subLabel}` : ''}</Text>
          <Text style={styles.topTitle} numberOfLines={1}>
            {block.name}
            {block.partsLabel ? <Text style={styles.topPart}> {block.partsLabel}</Text> : null}
          </Text>
        </View>
        <Pressable onPress={() => setShowKo((v) => !v)} style={styles.koToggle}>
          <Text style={[styles.koToggleText, { color: showKo ? C.accent : C.muted2 }]}>KO</Text>
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 48 + Math.max(insets.bottom, 24) }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Pattern card */}
        <View style={styles.patternCard}>
          <Text style={styles.patternLabel}>패턴</Text>
          <Text style={styles.patternText}>{block.pattern}</Text>
        </View>

        {/* Examples */}
        <Text style={styles.examplesHeader}>예문 ({block.examples.length})</Text>
        <View style={styles.examplesList}>
          {block.examples.map((ex, idx) => {
            const isPlaying = playingIdx === idx;
            const playCount = examplePlayCount[idx] ?? 0;
            return (
              <View key={`${block.id}-${idx}`} style={styles.exampleCard}>
                <View style={styles.exampleInner}>
                  <View style={styles.exampleText}>
                    <Text style={styles.exampleEn}>{ex.en}</Text>
                    {showKo ? <Text style={styles.exampleKo}>{ex.ko}</Text> : null}
                    {playCount > 0 ? (
                      <Text style={styles.examplePlayCount}>들음 {playCount}회</Text>
                    ) : null}
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={isPlaying ? '재생 정지' : '예문 듣기'}
                    onPress={() => handlePlay(idx)}
                    hitSlop={8}
                  >
                    <View style={[styles.playBtn, isPlaying && styles.playBtnActive]}>
                      {isPlaying ? (
                        <Text style={styles.playBtnStop}>■</Text>
                      ) : (
                        <PlayIcon size={14} color={C.paper} />
                      )}
                    </View>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>

        <Text style={styles.hint}>
          ▶ 듣고 따라 말하며 입에 붙이세요. 같은 패턴의 새 문장도 자연스럽게 만들어 보세요.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenH,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.line,
    gap: 8,
  },
  backBtn: { padding: 4 },
  topInfo: { flex: 1 },
  topLabel: { fontSize: 10, fontWeight: '700', color: C.muted, letterSpacing: 1.1 },
  topTitle: { fontSize: 15, fontWeight: '700', color: C.ink, marginTop: 2 },
  topPart: { fontSize: 11, fontWeight: '500', color: C.muted2 },
  koToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.paper2,
  },
  koToggleText: { fontSize: 11, fontWeight: '800' },

  content: { padding: spacing.screenH, gap: 16 },

  patternCard: {
    backgroundColor: C.ink,
    borderRadius: 18,
    padding: 18,
    gap: 8,
  },
  patternLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(245,240,230,0.62)',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  patternText: { fontSize: 15, lineHeight: 22, fontWeight: '600', color: C.paper },

  examplesHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginTop: 4,
  },
  examplesList: { gap: 8 },
  exampleCard: { borderRadius: 14, overflow: 'hidden' },
  exampleInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.line,
    borderRadius: 14,
  },
  exampleText: { flex: 1, minWidth: 0 },
  exampleEn: { fontSize: 16, fontWeight: '600', color: C.ink, lineHeight: 22 },
  exampleKo: { fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 16 },
  examplePlayCount: { fontSize: 10, color: C.sage, fontWeight: '700', marginTop: 5 },

  playBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: C.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  playBtnActive: { backgroundColor: C.ink },
  playBtnStop: { color: C.paper, fontSize: 13, fontWeight: '800' },

  hint: {
    fontSize: 11,
    color: C.muted,
    lineHeight: 16,
    marginTop: 8,
    paddingHorizontal: 4,
  },
});
