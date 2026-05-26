import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, spacing } from '@/lib/theme';
import { SectionLabel } from '@/components/common/SectionLabel';
import { ScreenState } from '@/components/common/ScreenState';
import { Chip } from '@/components/common/Chip';
import { ChevronIcon } from '@/components/common/Icons';
import { ProgressLine } from '@/components/common/ProgressLine';
import { CategoryTab } from '@/components/categories/CategoryTab';
import { mockExpressions, mockSituations } from '@/lib/mocks/expressions.mock';
import { useExpressions, useSituations } from '@/hooks/useLearningData';
import { USE_MOCK } from '@/lib/api';
import type { Category } from '@/types';

type TabId = 'life' | 'business' | 'it';

const TABS: { id: TabId; label: string; count: number }[] = [
  { id: 'life', label: '생활', count: 10 },
  { id: 'business', label: '비즈니스', count: 10 },
  { id: 'it', label: 'IT / 통신', count: 10 },
];

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabId>('life');
  const activeCategory = activeTab as Category;
  const situationsQuery = useSituations(activeCategory);
  const expressionsQuery = useExpressions({ category: activeCategory });
  const { data: situations } = situationsQuery;
  const { data: expressions } = expressionsQuery;

  const visibleSituations = situations ?? (USE_MOCK ? mockSituations.slice(0, 7) : []);
  const visibleExpressions = expressions?.items ?? (USE_MOCK ? mockExpressions.filter((item) => item.category === activeCategory) : []);
  const isLoading = !situations && !expressions && (situationsQuery.isLoading || expressionsQuery.isLoading);
  const isError = situationsQuery.isError || expressionsQuery.isError;
  const bottomContentPadding = 168 + Math.max(insets.bottom, 48);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomContentPadding }} showsVerticalScrollIndicator={false}>
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

          {isLoading ? (
            <ScreenState loading title="학습 영역을 불러오는 중" message="카테고리와 상황별 표현을 가져오고 있어요." />
          ) : isError ? (
            <ScreenState
              title="학습 영역을 불러오지 못했어요"
              message="백엔드 연결을 확인한 뒤 다시 시도해 주세요."
              actionLabel="다시 시도"
              onAction={() => {
                situationsQuery.refetch();
                expressionsQuery.refetch();
              }}
            />
          ) : activeTab !== 'life' ? (
            <View style={styles.lockedBanner}>
              <Text style={styles.lockedText}>Phase 2에서 추가될 예정입니다</Text>
              <Text style={styles.lockedSub}>생활영어 완료 후 순차 개방</Text>
            </View>
          ) : visibleSituations.length === 0 ? (
            <ScreenState title="아직 학습 상황이 없어요" message="표현 데이터가 추가되면 이곳에 표시됩니다." />
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

  list: { paddingHorizontal: spacing.screenH },
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
