import React from 'react';
import { Text, View } from 'react-native';

const DAYS = ['월', '화', '수', '목', '금', '토', '일'];

interface StreakBadgeProps {
  days: number;
  weekFlags: boolean[];
}

export function StreakBadge({ days, weekFlags }: StreakBadgeProps) {
  const completed = weekFlags.filter(Boolean).length;

  return (
    <View className="flex-row items-center gap-2 rounded-[14px] border border-line bg-card px-3 py-2.5">
      <Text className="font-inter-bold text-[13px] text-ink">{days}일 연속</Text>
      <Text className="flex-1 text-[11px] text-muted">이번 주 {completed}/7일 완료</Text>
      <View className="flex-row gap-1">
        {DAYS.map((day, index) => {
          const isDone = weekFlags[index];

          return (
            <View
              key={day}
              className={`h-4 w-4 items-center justify-center rounded ${isDone ? 'bg-sage' : 'bg-line'}`}
            >
              <Text className={`text-[8px] font-bold ${isDone ? 'text-white' : 'text-muted'}`}>{day}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}
