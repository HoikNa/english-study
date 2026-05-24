import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ProgressLine } from '@/components/common/ProgressLine';
import { C } from '@/lib/theme';

interface CategoryProgressRowProps {
  name: string;
  count: string;
  percent: number;
  color: string;
}

export function CategoryProgressRow({ name, count, percent, color }: CategoryProgressRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.name}>{name}</Text>
      <ProgressLine
        value={percent}
        label={count}
        fillClassName=""
        fillStyle={{ backgroundColor: color }}
        trackStyle={styles.track}
        labelStyle={styles.count}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    padding: 14,
    backgroundColor: C.card,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: C.line,
    gap: 6,
  },
  name: { fontSize: 13, fontWeight: '600' },
  track: { height: 4 },
  count: { width: 56, textAlign: 'right' },
});
