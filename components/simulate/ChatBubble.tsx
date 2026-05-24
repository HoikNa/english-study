import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '@/lib/theme';

interface CoachNote {
  from: string;
  to: string;
  why: string;
}

interface ChatBubbleProps {
  who: 'ai' | 'me';
  text: string;
  time: string;
  avatar?: string;
  coachNote?: CoachNote | null;
}

export function ChatBubble({ who, text, time, avatar = 'A', coachNote }: ChatBubbleProps) {
  if (who === 'ai') {
    return (
      <View style={styles.aiRow}>
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarText}>{avatar}</Text>
        </View>
        <View style={styles.aiContent}>
          <View style={styles.aiBubble}>
            <Text style={styles.aiBubbleText}>{text}</Text>
          </View>
          <Text style={styles.timeLabel}>{time}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.meRow}>
      <View style={styles.meBubble}>
        <Text style={styles.meBubbleText}>{text}</Text>
      </View>
      {coachNote && (
        <View style={styles.coachCard}>
          <Text style={styles.coachLabel}>코치 · 더 자연스럽게</Text>
          <Text style={styles.coachText}>
            <Text style={styles.coachFrom}>{coachNote.from}</Text>
            {' -> '}
            <Text style={styles.coachTo}>{coachNote.to}</Text>
          </Text>
          <Text style={styles.coachWhy}>{coachNote.why}</Text>
        </View>
      )}
      <Text style={[styles.timeLabel, styles.meTime]}>{time}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  aiRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-start' },
  aiAvatar: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: C.indigoSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  aiAvatarText: { fontSize: 10, fontWeight: '700', color: C.indigo },
  aiContent: { maxWidth: 280 },
  aiBubble: {
    backgroundColor: C.card,
    padding: 12,
    paddingHorizontal: 13,
    borderRadius: 16,
    borderTopLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: C.line,
  },
  aiBubbleText: { fontSize: 13, color: C.ink, lineHeight: 19 },
  timeLabel: { fontSize: 9, color: C.muted2, marginTop: 3, marginLeft: 4, fontFamily: 'IBMPlexMono' },
  meRow: { alignItems: 'flex-end', gap: 4 },
  meBubble: {
    maxWidth: 280,
    padding: 12,
    paddingHorizontal: 13,
    backgroundColor: C.ink,
    borderRadius: 16,
    borderTopRightRadius: 4,
  },
  meBubbleText: { fontSize: 13, color: C.paper, lineHeight: 19 },
  coachCard: {
    maxWidth: 290,
    padding: 10,
    paddingHorizontal: 12,
    backgroundColor: C.accentSoft,
    borderRadius: 12,
    borderTopRightRadius: 4,
    borderWidth: 0.5,
    borderColor: C.accent,
  },
  coachLabel: { fontSize: 9, fontWeight: '800', color: C.accent, letterSpacing: 0.5, marginBottom: 4 },
  coachText: { fontSize: 11.5, color: C.ink, lineHeight: 17 },
  coachFrom: { textDecorationLine: 'line-through', color: C.muted },
  coachTo: { fontWeight: '700' },
  coachWhy: { fontSize: 10, color: C.ink2, marginTop: 4 },
  meTime: { textAlign: 'right' },
});
