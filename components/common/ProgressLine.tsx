import React from 'react';
import { StyleProp, Text, TextStyle, View, ViewStyle } from 'react-native';

interface ProgressLineProps {
  value: number;
  label?: string;
  fillClassName?: string;
  fillStyle?: StyleProp<ViewStyle>;
  trackStyle?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
}

export function ProgressLine({
  value,
  label,
  fillClassName = 'bg-accent',
  fillStyle,
  trackStyle,
  labelStyle,
}: ProgressLineProps) {
  const normalized = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <View className="flex-row items-center gap-2">
      <View className="h-[3px] flex-1 overflow-hidden rounded-full bg-line" style={trackStyle}>
        <View
          className={`h-full rounded-full ${fillClassName}`}
          style={[{ width: `${normalized}%` }, fillStyle]}
        />
      </View>
      {label && (
        <Text className="font-mono text-[10px] text-muted" style={labelStyle}>
          {label}
        </Text>
      )}
    </View>
  );
}
