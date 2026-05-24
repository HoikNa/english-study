import React from 'react';
import { View } from 'react-native';
import { C } from '@/lib/theme';

interface MiniWaveformProps {
  bars?: number;
  activeBars?: number;
  compact?: boolean;
}

export function MiniWaveform({ bars = 32, activeBars = 12, compact }: MiniWaveformProps) {
  const heights = Array.from({ length: bars }, (_, index) => {
    const base = compact ? 4 : 6;
    const scale = compact ? 14 : 20;
    return base + Math.abs(Math.sin(index * 0.61)) * scale;
  });

  return (
    <View className="flex-1 flex-row items-center gap-0.5">
      {heights.map((height, index) => (
        <View
          key={index}
          className="flex-1 rounded-sm"
          style={{
            height,
            backgroundColor: index < activeBars ? C.ink : C.line2,
          }}
        />
      ))}
    </View>
  );
}
