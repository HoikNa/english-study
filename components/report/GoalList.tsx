import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { C } from '@/lib/theme';

interface WeeklyGoal {
  mark: string;
  text: string;
}

interface GoalListProps {
  goals: WeeklyGoal[];
}

export function GoalList({ goals }: GoalListProps) {
  return (
    <View style={styles.list}>
      {goals.map((goal) => (
        <View key={goal.text} style={styles.item}>
          <View style={styles.mark}>
            <Text style={styles.markText}>{goal.mark}</Text>
          </View>
          <Text style={styles.text}>{goal.text}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 10 },
  item: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  mark: {
    width: 24,
    height: 24,
    borderRadius: 999,
    backgroundColor: 'rgba(201,154,63,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  markText: { fontSize: 11, fontWeight: '800', color: C.gold, fontFamily: 'IBMPlexMono' },
  text: { fontSize: 13, color: C.ink2, fontWeight: '500' },
});
