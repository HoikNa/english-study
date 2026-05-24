import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C, shadow, spacing } from '@/lib/theme';

export interface ReportPattern {
  rank: string;
  bad: string;
  good: string;
  why: string;
  category: string;
}

interface PatternCardProps {
  pattern: ReportPattern;
}

export function PatternCard({ pattern }: PatternCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <Text style={styles.rank}>{pattern.rank}</Text>
        <View style={styles.categoryTag}>
          <Text style={styles.categoryTagText}>{pattern.category}</Text>
        </View>
      </View>

      <View style={styles.expressionBlock}>
        <Text style={styles.badText}>"{pattern.bad}"</Text>
        <View style={styles.arrowRow}>
          <View style={styles.arrowLine} />
          <Text style={styles.arrowLabel}>개선</Text>
          <View style={styles.arrowLine} />
        </View>
        <Text style={styles.goodText}>"{pattern.good}"</Text>
      </View>

      <View style={styles.whyBlock}>
        <Text style={styles.whyText}>{pattern.why}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.screenH,
    marginBottom: 14,
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: C.line,
    overflow: 'hidden',
    ...shadow.cardSubtle,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.line,
  },
  rank: {
    fontSize: 22,
    color: C.accent,
    fontFamily: 'InstrumentSerifItalic',
    lineHeight: 26,
  },
  categoryTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: C.accentSoft,
    borderRadius: 6,
  },
  categoryTagText: { fontSize: 10, fontWeight: '700', color: C.accent, letterSpacing: 0.4 },
  expressionBlock: { paddingHorizontal: 16, paddingVertical: 14, gap: 8 },
  badText: {
    fontSize: 13.5,
    color: C.rose,
    textDecorationLine: 'line-through',
    fontWeight: '500',
    lineHeight: 20,
  },
  arrowRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  arrowLine: { flex: 1, height: 0.5, backgroundColor: C.line2 },
  arrowLabel: { fontSize: 9, fontWeight: '700', color: C.muted, letterSpacing: 0.5 },
  goodText: { fontSize: 13.5, color: C.sage, fontWeight: '600', lineHeight: 20 },
  whyBlock: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderTopWidth: 0.5,
    borderTopColor: C.line,
    paddingTop: 10,
    backgroundColor: C.paper,
  },
  whyText: { fontSize: 11.5, color: C.ink2, lineHeight: 17 },
});
