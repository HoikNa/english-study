import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CheckIcon } from '@/components/common/Icons';
import { C, shadow, spacing } from '@/lib/theme';

export interface ToneOption {
  id: 'direct' | 'diplomatic' | 'concise';
  label: string;
  labelKo: string;
  text: string;
  note: string;
}

interface ToneOptionCardProps {
  tone: ToneOption;
  selected: boolean;
  onPress: () => void;
}

export function ToneOptionCard({ tone, selected, onPress }: ToneOptionCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        selected && styles.cardSelected,
        pressed && { opacity: 0.92 },
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <View style={[styles.tag, selected && styles.tagSelected]}>
          <Text style={[styles.tagText, selected && styles.tagTextSelected]}>{tone.label}</Text>
        </View>
        <Text style={[styles.labelKo, selected && styles.labelKoSelected]}>{tone.labelKo}</Text>
        {selected && (
          <View style={styles.checkCircle}>
            <CheckIcon size={12} color="#fff" />
          </View>
        )}
      </View>

      <Text style={[styles.text, selected && styles.textSelected]}>"{tone.text}"</Text>
      <Text style={[styles.note, selected && styles.noteSelected]}>{tone.note}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.screenH,
    marginBottom: 10,
    padding: 16,
    borderRadius: 16,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.line,
    ...shadow.cardSubtle,
  },
  cardSelected: {
    backgroundColor: C.ink,
    borderColor: C.ink,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    backgroundColor: C.paper2,
    borderRadius: 6,
  },
  tagSelected: { backgroundColor: 'rgba(255,255,255,0.15)' },
  tagText: { fontSize: 10, fontWeight: '800', color: C.muted, letterSpacing: 0.5 },
  tagTextSelected: { color: 'rgba(255,255,255,0.7)' },
  labelKo: { fontSize: 12, color: C.muted, flex: 1 },
  labelKoSelected: { color: 'rgba(255,255,255,0.5)' },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 999,
    backgroundColor: C.sage,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { fontSize: 15, color: C.ink, lineHeight: 22, fontWeight: '500', marginBottom: 8 },
  textSelected: { color: '#fff' },
  note: { fontSize: 11, color: C.muted },
  noteSelected: { color: 'rgba(255,255,255,0.5)' },
});
