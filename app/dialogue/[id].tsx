import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView, Platform,
} from 'react-native';
import { useLocalSearchParams, router, type Href } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, spacing } from '@/lib/theme';
import { ChevronIcon } from '@/components/common/Icons';
import { ScreenState } from '@/components/common/ScreenState';
import { useDialogue } from '@/hooks/useDialogue';
import { useTts } from '@/hooks/useTts';
import { getApiErrorMessage } from '@/lib/api';
import type { DialogueTurn } from '@/types';

export default function DialogueScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const dialogueQuery = useDialogue(id);
  const dialogue = dialogueQuery.data;
  const tts = useTts();
  const insets = useSafeAreaInsets();
  const bottomClearance = Platform.OS === 'android' ? Math.max(insets.bottom, 24) : Math.max(insets.bottom, 12);

  const [currentIndex, setCurrentIndex] = useState<number | null>(null);
  const [showKo, setShowKo] = useState(true);
  const [autoPlaying, setAutoPlaying] = useState(false);
  const cancelRef = useRef(false);
  const scrollRef = useRef<ScrollView>(null);

  const playTurn = useCallback(
    async (idx: number) => {
      if (!dialogue) return;
      const turn = dialogue.turns[idx];
      if (!turn) return;
      const voice = turn.speaker === 'A' ? dialogue.speakerAVoice : dialogue.speakerBVoice;
      setCurrentIndex(idx);
      await tts.playText(turn.textEn, undefined, voice);
    },
    [dialogue, tts]
  );

  const playAll = useCallback(async () => {
    if (!dialogue) return;
    cancelRef.current = false;
    setAutoPlaying(true);
    for (let i = 0; i < dialogue.turns.length; i++) {
      if (cancelRef.current) break;
      await playTurn(i);
      if (cancelRef.current) break;
      await new Promise((r) => setTimeout(r, 350));
    }
    setAutoPlaying(false);
    setCurrentIndex(null);
  }, [dialogue, playTurn]);

  const stopAll = useCallback(() => {
    cancelRef.current = true;
    tts.stop();
    setAutoPlaying(false);
    setCurrentIndex(null);
  }, [tts]);

  useEffect(() => () => {
    cancelRef.current = true;
  }, []);

  if (dialogueQuery.isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenState loading title="대화를 불러오는 중" message="오늘의 대화 데이터를 가져오고 있어요." />
      </SafeAreaView>
    );
  }

  if (dialogueQuery.isError || !dialogue) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenState
          title="대화를 불러오지 못했어요"
          message={dialogueQuery.error ? getApiErrorMessage(dialogueQuery.error) : '백엔드 연결 상태를 확인해 주세요.'}
          actionLabel="다시 시도"
          onAction={() => dialogueQuery.refetch()}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable
          onPress={() => {
            stopAll();
            router.back();
          }}
          style={styles.backBtn}
        >
          <ChevronIcon dir="left" color={C.ink} size={20} />
        </Pressable>
        <View style={styles.topInfo}>
          <Text style={styles.topLabel}>오늘의 대화</Text>
          <Text style={styles.topTitle} numberOfLines={1}>
            {dialogue.situationKo}
          </Text>
        </View>
        <Pressable onPress={() => setShowKo((v) => !v)} style={styles.koToggle}>
          <Text style={[styles.koToggleText, { color: showKo ? C.accent : C.muted2 }]}>KO</Text>
        </Pressable>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.body}
        contentContainerStyle={[styles.bodyContent, { paddingBottom: 140 + bottomClearance }]}
        showsVerticalScrollIndicator={false}
      >
        {dialogue.turns.map((turn, idx) => (
          <DialogueBubble
            key={turn.id}
            turn={turn}
            speakerName={turn.speaker === 'A' ? dialogue.speakerAName : dialogue.speakerBName}
            showKo={showKo}
            playing={currentIndex === idx}
            onPress={() => playTurn(idx)}
            onShadow={
              turn.expressionId
                ? () => router.push(`/shadowing/${turn.expressionId}` as Href)
                : undefined
            }
          />
        ))}
      </ScrollView>

      <View style={[styles.controls, { paddingBottom: 12 + bottomClearance }]}>
        {autoPlaying ? (
          <Pressable onPress={stopAll} style={[styles.controlBtn, styles.controlBtnPause]}>
            <Text style={styles.controlPauseText}>■ 정지</Text>
          </Pressable>
        ) : (
          <Pressable onPress={playAll} style={[styles.controlBtn, styles.controlBtnPlay]}>
            <Text style={styles.controlPlayText}>▶ 처음부터 듣기</Text>
          </Pressable>
        )}
      </View>
    </SafeAreaView>
  );
}

interface BubbleProps {
  turn: DialogueTurn;
  speakerName?: string;
  showKo: boolean;
  playing: boolean;
  onPress: () => void;
  onShadow?: () => void;
}

function DialogueBubble({ turn, speakerName, showKo, playing, onPress, onShadow }: BubbleProps) {
  const isA = turn.speaker === 'A';
  return (
    <View style={[styles.bubbleRow, isA ? styles.bubbleRowLeft : styles.bubbleRowRight]}>
      {isA ? (
        <View style={[styles.avatar, styles.avatarA]}>
          <Text style={styles.avatarTextA}>{speakerName?.[0]?.toUpperCase() ?? 'A'}</Text>
        </View>
      ) : null}
      <View style={[styles.bubbleCol, isA ? styles.bubbleColLeft : styles.bubbleColRight]}>
        <Text style={[styles.speakerName, !isA && styles.speakerNameRight]}>
          {speakerName ?? (isA ? 'A' : 'B')}
        </Text>
        <Pressable onPress={onPress} hitSlop={4}>
          <View
            style={[
              styles.bubbleInner,
              isA ? styles.bubbleInnerA : styles.bubbleInnerB,
              playing && styles.bubbleInnerActive,
            ]}
          >
            <Text style={[styles.bubbleEn, !isA && styles.bubbleEnRight]}>{turn.textEn}</Text>
            {showKo && turn.textKo ? (
              <Text style={[styles.bubbleKo, !isA && styles.bubbleKoRight]}>{turn.textKo}</Text>
            ) : null}
          </View>
        </Pressable>
        {onShadow ? (
          <Pressable onPress={onShadow} hitSlop={6} style={isA ? styles.shadowPillLeft : styles.shadowPillRight}>
            <View style={styles.shadowPillInner}>
              <Text style={styles.shadowPillText}>🎤  이 표현 쉐도잉  →</Text>
            </View>
          </Pressable>
        ) : null}
      </View>
      {!isA ? (
        <View style={[styles.avatar, styles.avatarB]}>
          <Text style={styles.avatarTextB}>{speakerName?.[0]?.toUpperCase() ?? 'B'}</Text>
        </View>
      ) : null}
    </View>
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
  topTitle: { fontSize: 14, fontWeight: '700', color: C.ink, marginTop: 2 },
  koToggle: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: C.paper2,
  },
  koToggleText: { fontSize: 11, fontWeight: '800' },

  body: { flex: 1 },
  bodyContent: {
    padding: spacing.screenH,
    gap: 14,
  },

  bubbleRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
  },
  bubbleRowLeft: { justifyContent: 'flex-start' },
  bubbleRowRight: { justifyContent: 'flex-end' },

  avatar: {
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarA: { backgroundColor: C.paper2 },
  avatarB: { backgroundColor: C.ink },
  avatarTextA: { fontSize: 13, fontWeight: '800', color: C.ink },
  avatarTextB: { fontSize: 13, fontWeight: '800', color: C.paper },

  bubbleCol: {
    maxWidth: '78%',
    gap: 4,
  },
  bubbleColLeft: { alignItems: 'flex-start' },
  bubbleColRight: { alignItems: 'flex-end' },

  speakerName: { fontSize: 10, fontWeight: '700', color: C.muted, marginLeft: 2 },
  speakerNameRight: { marginLeft: 0, marginRight: 2 },

  // Bubble inner (BG/border는 inner View에서 처리 — Pressable + function-style + Android 미렌더 회피)
  bubbleInner: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  bubbleInnerA: {
    backgroundColor: C.card,
    borderTopLeftRadius: 4,
    borderColor: C.line,
    borderWidth: 1,
  },
  bubbleInnerB: {
    backgroundColor: C.ink,
    borderTopRightRadius: 4,
  },
  bubbleInnerActive: {
    borderColor: C.accent,
    borderWidth: 2,
  },
  bubbleEn: { fontSize: 15, lineHeight: 21, fontWeight: '600', color: C.ink },
  bubbleEnRight: { color: C.paper },
  bubbleKo: { fontSize: 12, lineHeight: 17, color: C.muted, marginTop: 6 },
  bubbleKoRight: { color: 'rgba(245,240,230,0.62)' },

  // Shadow pill — BG는 inner View로
  shadowPillLeft: { alignSelf: 'flex-start', marginTop: 6 },
  shadowPillRight: { alignSelf: 'flex-end', marginTop: 6 },
  shadowPillInner: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: C.accent,
  },
  shadowPillText: { fontSize: 12, fontWeight: '800', color: '#fff' },

  controls: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    paddingHorizontal: spacing.screenH,
    paddingTop: 12,
    backgroundColor: C.paper,
    borderTopWidth: 0.5,
    borderTopColor: C.line,
  },
  controlBtn: {
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnPlay: { backgroundColor: C.accent },
  controlBtnPause: { backgroundColor: C.ink },
  controlPlayText: { fontSize: 15, fontWeight: '800', color: '#fff' },
  controlPauseText: { fontSize: 15, fontWeight: '800', color: C.paper },
});
