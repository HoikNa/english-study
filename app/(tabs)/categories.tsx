import React, { useMemo, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView,
} from 'react-native';
import { router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, spacing } from '@/lib/theme';
import { ScreenState } from '@/components/common/ScreenState';
import { ChevronIcon } from '@/components/common/Icons';
import { CategoryTab } from '@/components/categories/CategoryTab';
import { useDialogues } from '@/hooks/useDialogue';
import { getApiErrorMessage } from '@/lib/api';
import type { Category, Dialogue } from '@/types';

type TabId = 'life' | 'business' | 'it';

const TAB_DEFS: { id: TabId; label: string }[] = [
  { id: 'life', label: '생활' },
  { id: 'business', label: '비즈니스' },
  { id: 'it', label: 'IT / 통신' },
];

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabId>('life');
  const activeCategory = activeTab as Category;
  const dialoguesQuery = useDialogues();

  const allDialogues = dialoguesQuery.data ?? [];
  const dialogues = useMemo(
    () => allDialogues.filter((d) => d.category === activeCategory),
    [allDialogues, activeCategory],
  );

  const tabs = useMemo(
    () => TAB_DEFS.map((t) => ({ ...t, count: allDialogues.filter((d) => d.category === t.id).length })),
    [allDialogues],
  );

  const bottomContentPadding = 168 + Math.max(insets.bottom, 48);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={{ paddingBottom: bottomContentPadding }} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.sub}>학습 영역</Text>
          <Text style={styles.title}>
            오늘 들을 <Text style={styles.titleSerif}>대화를 골라보세요</Text>
          </Text>
        </View>

        <CategoryTab tabs={tabs} active={activeTab} onSelect={setActiveTab} />

        <View style={styles.list}>
          {dialoguesQuery.isLoading ? (
            <ScreenState loading title="대화를 불러오는 중" message="카테고리별 학습 대화를 가져오고 있어요." />
          ) : dialoguesQuery.isError ? (
            <ScreenState
              title="대화를 불러오지 못했어요"
              message={getApiErrorMessage(dialoguesQuery.error)}
              actionLabel="다시 시도"
              onAction={() => dialoguesQuery.refetch()}
            />
          ) : dialogues.length === 0 ? (
            <ScreenState
              title="이 카테고리에 대화가 없어요"
              message="다른 카테고리를 확인해 보세요."
            />
          ) : (
            <View style={styles.dialogueList}>
              {dialogues.map((dlg, idx) => (
                <DialogueCard
                  key={dlg.id}
                  index={idx + 1}
                  dialogue={dlg}
                  onPress={() => router.push(`/dialogue/${dlg.id}` as Href)}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DialogueCard({
  index,
  dialogue,
  onPress,
}: {
  index: number;
  dialogue: Dialogue;
  onPress: () => void;
}) {
  const keyCount = dialogue.turns.filter((t) => t.expressionId).length;
  const speakerLabel = dialogue.speakerAName ? `${dialogue.speakerAName} · You` : `A · You`;

  return (
    <Pressable onPress={onPress} hitSlop={4}>
      <View style={styles.dialogueCardInner}>
        <Text style={styles.idx}>{String(index).padStart(2, '0')}</Text>
        <View style={styles.dialogueInfo}>
          <Text style={styles.dialogueTitle} numberOfLines={1}>{dialogue.situationKo}</Text>
          <Text style={styles.dialogueSub}>
            Level {dialogue.level} · {dialogue.turns.length}턴 · 키 표현 {keyCount}
          </Text>
          <Text style={styles.dialogueSpeakers}>{speakerLabel}</Text>
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

  list: { paddingHorizontal: spacing.screenH },
  dialogueList: { gap: 8 },
  dialogueCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    paddingHorizontal: 16,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: C.line,
  },
  idx: {
    fontSize: 11,
    fontWeight: '500',
    color: C.muted2,
    fontFamily: 'IBMPlexMono',
    width: 22,
  },
  dialogueInfo: { flex: 1, minWidth: 0, gap: 2 },
  dialogueTitle: { fontSize: 14, fontWeight: '700', color: C.ink },
  dialogueSub: { fontSize: 11, color: C.muted },
  dialogueSpeakers: { fontSize: 10, color: C.muted2, marginTop: 2 },
});
