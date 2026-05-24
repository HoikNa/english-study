import React from 'react';
import { Text, View } from 'react-native';

interface ScoreBarProps {
  label: string;
  value: number;
}

function scoreColorClass(value: number) {
  if (value >= 80) return { text: 'text-sage', fill: 'bg-sage-soft' };
  if (value >= 60) return { text: 'text-gold', fill: 'bg-gold-soft' };
  return { text: 'text-rose', fill: 'bg-accent-soft' };
}

export function ScoreBar({ label, value }: ScoreBarProps) {
  const colorClass = scoreColorClass(value);

  return (
    <View className="min-w-[45%] flex-1 rounded-md border border-white/10 bg-white/5 p-3">
      <Text className="font-inter-semibold text-[10px] text-paper/55">{label}</Text>
      <View className="mt-1 flex-row items-baseline gap-1">
        <Text className={`font-inter-bold text-[22px] ${colorClass.text}`}>{value}</Text>
        <Text className="text-[10px] text-paper/40">/100</Text>
      </View>
      <View className="mt-2 h-[3px] overflow-hidden rounded-full bg-white/10">
        <View className={`h-full rounded-full ${colorClass.fill}`} style={{ width: `${value}%` }} />
      </View>
    </View>
  );
}
