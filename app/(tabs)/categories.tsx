import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { C, spacing } from '@/lib/theme';
import { SectionLabel } from '@/components/common/SectionLabel';
import { Chip } from '@/components/common/Chip';
import { ChevronIcon } from '@/components/common/Icons';
import { ProgressLine } from '@/components/common/ProgressLine';
import { CategoryTab } from '@/components/categories/CategoryTab';
import { mockExpressions, mockSituations } from '@/lib/mocks/expressions.mock';
import { useExpressions, useSituations } from '@/hooks/useLearningData';
import type { Category } from '@/types';

type TabId = 'life' | 'business' | 'it';

const TABS: { id: TabId; label: string; count: number }[] = [
  { id: 'life', label: '생활', count: 10 },
  { id: 'business', label: '비즈니스', count: 10 },
  { id: 'it', label: 'IT / 통신', count: 10 },
];

export default function CategoriesScreen() {
  const [activeTab, setActiveTab] = useState<TabId>('life');
  const activeCategory = activeTab as Category;
  const { data: situations } = useSituations(activeCategory);
  const { data: expressions } = useExpressions({ category: activeCategory });

  const visibleSituations = situations ?? mockSituations.slice(0, 7);
  const visibleExpressions = expressions?.items ?? mockExpressions.filter((item) => item.category === activeCategory);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.sub}>학습 영역</Text>
          <Text style={styles.title}>
            무엇을 <Text style={styles.titleSerif}>연습할까요?</Text>
          </Text>
        </View>

        <CategoryTab tabs={TABS} active={activeTab} onSelect={setActiveTab} />

        {/* List */}
        <View style={styles.list}>
          <SectionLabel style={{ marginBottom: 10 }}>
            {activeTab === 'life' ? '이민 정착 · MVP' : activeTab === 'business' ? '비즈니스 영어 · Phase 2' : 'IT/통신 기술 · Phase 2'}
          </SectionLabel>

          {activeTab !== 'life' ? (
            <View style={styles.lockedBanner}>
              <Text style={styles.lockedText}>🔒 Phase 2에서 추가될 예정입니다</Text>
              <Text style={styles.lockedSub}>생활영어 완료 후 순차 개방</Text>
            </View>
          ) : (
            <View style={styles.situationList}>
              {visibleSituations.map((sit) => {
                const pct = sit.totalExpressions > 0
                  ? (sit.completedExpressions / sit.totalExpressions) * 100
                  : 0;
                const expression = visibleExpressions.find((item) => item.situationKo === sit.name) ?? visibleExpressions[0] ?? mockExpressions[0];
                const isDone = pct === 100;
                const isNew = pct === 0;
                const isIn = pct > 0 && pct < 100;

                return (
                  <Pressable
                    key={sit.id}
                    style={({ pressed }) => [
                      styles.situationRow,
                      pressed && { opacity: 0.8, transform: [{ scale: 0.99 }] },
                    ]}
                    onPress={() => router.push(`/shadowing/${expression.id}`)}
                  >
                    <Text style={styles.idx}>{sit.idx}</Text>
                    <View style={styles.situationInfo}>
                      <View style={styles.situationNameRow}>
                        <Text style={styles.situationName}>{sit.name}</Text>
                        {isDone && sit.bestScore && (
                          <Chip color={C.sage} bg={C.sageSoft} style={styles.chip}>
                            완료 {sit.bestScore}
                          </Chip>
                        )}
                        {isNew && (
                          <Chip color={C.ink2} bg={C.paper2} style={styles.chip}>NEW</Chip>
                        )}
                      </View>
                      <Text style={styles.situationSub}>
                        {sit.nameEn} · {sit.totalExpressions} expressions
                      </Text>
                      {isIn && (
                        <View style={styles.progressRow}>
                          <ProgressLine value={pct} label={`${Math.round(pct)}%`} />
                        </View>
                      )}
                    </View>
                    <ChevronIcon color={C.muted2} />
                  </Pressable>
                );
              })}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper },
  header: { paddingHorizontal: spacing.screenH, paddingTop: 8, paddingBottom: 12 },
  sub: { fontSize: 11, fontWeight: '600', color: C.muted, letterSpacing: 0.5 },
  title: { fontSize: 26, fontWeight: '700', letterSpacing: -0.78, marginTop: 2 },
  titleSerif: { fontFamily: 'InstrumentSerifItalic', fontSize: 26, fontWeight: '400' },

  list: { paddingHorizontal: spacing.screenH, paddingBottom: 100 },
  lockedBanner: {
    padding: 20, backgroundColor: C.paper2, borderRadius: 16,
    alignItems: 'center', gap: 6,
  },
  lockedText: { fontSize: 14, fontWeight: '600', color: C.ink2 },
  lockedSub: { fontSize: 12, color: C.muted },

  situationList: { gap: 8 },
  situationRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    padding: 14, paddingHorizontal: 16,
    backgroundColor: C.card, borderRadius: 16, borderWidth: 0.5, borderColor: C.line,
  },
  idx: { fontSize: 11, fontWeight: '500', color: C.muted2, fontFamily: 'IBMPlexMono', width: 18 },
  situationInfo: { flex: 1, minWidth: 0 },
  situationNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  situationName: { fontSize: 14, fontWeight: '600' },
  chip: { paddingVertical: 2, paddingHorizontal: 7 },
  situationSub: { fontSize: 11, color: C.muted, marginTop: 2 },
  progressRow: { marginTop: 7 },
});
