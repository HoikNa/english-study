import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import { C } from '@/lib/theme';

interface MetricTileProps {
  label: string;
  value: React.ReactNode;
  suffix?: string;
  accent?: boolean;
  dark?: boolean;
  style?: StyleProp<ViewStyle>;
  valueStyle?: StyleProp<TextStyle>;
}

export function MetricTile({
  label,
  value,
  suffix,
  accent = false,
  dark = false,
  style,
  valueStyle,
}: MetricTileProps) {
  return (
    <View style={[styles.tile, style]}>
      <Text style={[styles.value, dark && styles.valueDark, accent && styles.valueAccent, valueStyle]}>
        {value}
        {suffix ? <Text style={[styles.suffix, dark && styles.suffixDark]}>{suffix}</Text> : null}
      </Text>
      <Text style={[styles.label, dark && styles.labelDark]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { flex: 1, alignItems: 'center', gap: 4 },
  value: { fontSize: 20, fontWeight: '700', color: C.ink, fontFamily: 'IBMPlexMono' },
  valueDark: { color: '#fff' },
  valueAccent: { color: C.sage },
  suffix: { fontSize: 11, fontWeight: '500', color: C.muted },
  suffixDark: { color: 'rgba(255,255,255,0.5)' },
  label: { fontSize: 10, color: C.muted, fontWeight: '500' },
  labelDark: { color: 'rgba(255,255,255,0.45)' },
});
