import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { C, spacing } from '@/lib/theme';

interface ScreenStateProps {
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  loading?: boolean;
}

export function ScreenState({ title, message, actionLabel, onAction, loading }: ScreenStateProps) {
  return (
    <View style={styles.wrap}>
      {loading && <ActivityIndicator color={C.accent} />}
      <Text style={styles.title}>{title}</Text>
      {message && <Text style={styles.message}>{message}</Text>}
      {actionLabel && onAction && (
        <Pressable style={({ pressed }) => [styles.action, pressed && { opacity: 0.75 }]} onPress={onAction}>
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: spacing.screenH,
    paddingVertical: 48,
  },
  title: { color: C.ink, fontSize: 18, fontWeight: '800', textAlign: 'center' },
  message: { color: C.muted, fontSize: 13, lineHeight: 19, textAlign: 'center' },
  action: {
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: C.ink,
  },
  actionText: { color: C.paper, fontSize: 13, fontWeight: '800' },
});
