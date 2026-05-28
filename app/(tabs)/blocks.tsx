import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, spacing } from '@/lib/theme';
import { ChevronIcon } from '@/components/common/Icons';
import {
  soundBlocks,
  SOUND_BLOCK_CATEGORY_LABELS,
  SOUND_BLOCK_SUBCATEGORY_LABELS,
} from '@/lib/data/sound_blocks';
import type { SoundBlock, SoundBlockCategory, SoundBlockSubcategory } from '@/types';

const CATEGORY_TABS: { id: SoundBlockCategory; count: number }[] = (['start', 'core', 'detail', 'advanced'] as const).map(
  (cat) => ({ id: cat, count: soundBlocks.filter((b) => b.category === cat).length }),
);

const SUBCATEGORY_ORDER: SoundBlockSubcategory[] = ['be-verb', 'i-verb', 'modal', 'perfect-conditional'];

export default function BlocksScreen() {
  const insets = useSafeAreaInsets();
  const [activeCategory, setActiveCategory] = useState<SoundBlockCategory>('start');
  const bottomContentPadding = 24 + Math.max(insets.bottom, 48);

  const categoryBlocks = useMemo(
    () => soundBlocks.filter((b) => b.category === activeCategory).sort((a, b) => a.order - b.order),
    [activeCategory],
  );

  // 시작 카테고리만 sub-section으로 그룹핑
  const groupedBlocks = useMemo(() => {
    if (activeCategory !== 'start') {
      return [{ key: 'all', label: null, blocks: categoryBlocks }];
    }
    return SUBCATEGORY_ORDER.map((sub) => ({
      key: sub,
      label: SOUND_BLOCK_SUBCATEGORY_LABELS[sub],
      blocks: categoryBlocks.filter((b) => b.subcategory === sub),
    })).filter((g) => g.blocks.length > 0);
  }, [activeCategory, categoryBlocks]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomContentPadding }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.sub}>소리블록 학습</Text>
          <Text style={styles.title}>
            패턴 한 덩어리, <Text style={styles.titleSerif}>입에 붙도록</Text>
          </Text>
        </View>

        {/* Category tabs */}
        <View style={styles.tabRow}>
          {CATEGORY_TABS.map(({ id, count }) => {
            const active = id === activeCategory;
            return (
              <Pressable
                key={id}
                onPress={() => setActiveCategory(id)}
                style={({ pressed }) => [styles.tab, active && styles.tabActive, pressed && { opacity: 0.85 }]}
              >
                <Text style={[styles.tabLabel, active && styles.tabLabelActive]}>
                  {SOUND_BLOCK_CATEGORY_LABELS[id]}
                </Text>
                <Text style={[styles.tabCount, active && styles.tabCountActive]}>{count}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Block list (grouped) */}
        <View style={styles.list}>
          {groupedBlocks.map((group) => (
            <View key={group.key} style={styles.groupBlock}>
              {group.label ? (
                <Text style={styles.groupLabel}>{group.label}</Text>
              ) : null}
              {group.blocks.map((block) => (
                <BlockCard key={block.id} block={block} />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function BlockCard({ block }: { block: SoundBlock }) {
  const previewExample = block.examples[0];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${block.name} 학습`}
      onPress={() => router.push(`/block/${block.id}` as Href)}
      style={({ pressed }) => [styles.row, pressed && { opacity: 0.85 }]}
    >
      <View style={styles.rowInner}>
        <Text style={styles.rowNum}>{String(block.order).padStart(2, '0')}</Text>
        <View style={styles.rowInfo}>
          <View style={styles.rowTitleRow}>
            <Text style={styles.rowTitle}>{block.name}</Text>
            {block.partsLabel ? <Text style={styles.rowPart}>{block.partsLabel}</Text> : null}
          </View>
          <Text style={styles.rowPattern} numberOfLines={2}>{block.pattern}</Text>
          {previewExample ? (
            <Text style={styles.rowExample} numberOfLines={1}>{previewExample.en}</Text>
          ) : null}
        </View>
        <ChevronIcon color={C.muted2} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper },
  header: { paddingHorizontal: spacing.screenH, paddingTop: 8, paddingBottom: 12 },
  sub: { fontSize: 11, fontWeight: '600', color: C.muted, letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.78, marginTop: 2 },
  titleSerif: { fontFamily: 'InstrumentSerifItalic', fontSize: 26, fontWeight: '400' },

  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenH,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: C.paper2,
  },
  tabActive: { backgroundColor: C.ink },
  tabLabel: { fontSize: 12, fontWeight: '700', color: C.muted },
  tabLabelActive: { color: C.paper },
  tabCount: { fontSize: 10, fontWeight: '700', color: C.muted2, fontFamily: 'IBMPlexMonoSemiBold' },
  tabCountActive: { color: 'rgba(245,240,230,0.62)' },

  list: { paddingHorizontal: spacing.screenH, gap: 18 },
  groupBlock: { gap: 8 },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    marginBottom: 2,
  },

  row: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  rowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: C.card,
    borderWidth: 0.5,
    borderColor: C.line,
    borderRadius: 14,
  },
  rowNum: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted2,
    fontFamily: 'IBMPlexMonoSemiBold',
    width: 22,
  },
  rowInfo: { flex: 1, minWidth: 0 },
  rowTitleRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: C.ink },
  rowPart: { fontSize: 10, fontWeight: '600', color: C.muted2 },
  rowPattern: { fontSize: 11, color: C.muted, marginTop: 3, lineHeight: 15 },
  rowExample: { fontSize: 12, color: C.ink2, marginTop: 4, fontStyle: 'italic' },
});
