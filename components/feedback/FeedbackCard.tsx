import React from 'react';
import { Pressable, Text, View } from 'react-native';
import { Card } from '@/components/common/Card';
import { PlayIcon } from '@/components/common/Icons';
import { C } from '@/lib/theme';

interface FeedbackAlternative {
  en: string;
  ko: string;
}

interface FeedbackCardProps {
  issue: string;
  alternatives: FeedbackAlternative[];
  focusWord?: string;
}

export function FeedbackCard({ issue, alternatives, focusWord = 'clarify' }: FeedbackCardProps) {
  const normalizedIssue = issue.replace(`'${focusWord}'의`, '의');

  return (
    <Card padding={16}>
      <Text className="text-xs leading-5 text-ink-2">
        <Text className="font-inter-bold text-rose">'{focusWord}'</Text>
        {normalizedIssue}
      </Text>

      <View className="-mx-4 my-4 h-px bg-line" />

      <Text className="mb-2 font-inter-bold text-[11px] uppercase text-muted">원어민이 자주 쓰는 대안</Text>
      <View className="gap-2">
        {alternatives.map((alt, index) => (
          <View
            key={alt.en}
            className="flex-row items-start gap-2 rounded-md border border-line bg-paper p-3"
          >
            <Text className="mt-0.5 font-mono text-[9px] text-muted-2">0{index + 1}</Text>
            <View className="flex-1">
              <Text className="font-inter-medium text-[12.5px] leading-[18px] text-ink">{alt.en}</Text>
              <Text className="mt-1 text-[10px] text-muted">{alt.ko}</Text>
            </View>
            <Pressable accessibilityRole="button" accessibilityLabel={`${alt.en} 듣기`} className="p-1">
              <PlayIcon color={C.ink} size={12} />
            </Pressable>
          </View>
        ))}
      </View>
    </Card>
  );
}
