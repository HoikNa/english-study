import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { C } from '@/lib/theme';

interface SuggestionPillProps {
  text: string;
  onPress: () => void;
}

export function SuggestionPill({ text, onPress }: SuggestionPillProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.pill, pressed && { opacity: 0.82 }]}
      onPress={onPress}
    >
      <Text style={styles.text}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    backgroundColor: C.card,
    borderRadius: 999,
    borderWidth: 0.5,
    borderColor: C.line2,
  },
  text: { fontSize: 10.5, color: C.ink2 },
});
