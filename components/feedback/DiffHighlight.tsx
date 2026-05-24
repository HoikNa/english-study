import React from 'react';
import { Text, View } from 'react-native';

export type WordStatus = 'ok' | 'warn' | 'bad';

export interface WordResult {
  word: string;
  status: WordStatus;
}

function wordClass(status: WordStatus) {
  if (status === 'bad') return 'text-rose underline decoration-rose';
  if (status === 'warn') return 'text-gold underline decoration-gold';
  return 'text-ink';
}

export function DiffHighlight({ words }: { words: WordResult[] }) {
  const counts = words.reduce(
    (acc, word) => {
      acc[word.status] += 1;
      return acc;
    },
    { ok: 0, warn: 0, bad: 0 } satisfies Record<WordStatus, number>
  );

  return (
    <View>
      <View className="mb-3 flex-row flex-wrap">
        {words.map((item, index) => (
          <Text
            key={`${item.word}-${index}`}
            className={`font-inter-medium text-[17px] leading-[30px] ${wordClass(item.status)}`}
          >
            {item.word}{' '}
          </Text>
        ))}
      </View>
      <View className="flex-row gap-4">
        <Text className="font-inter-semibold text-[10px] text-rose">━ 오발음 {counts.bad}</Text>
        <Text className="font-inter-semibold text-[10px] text-gold">┄ 약함 {counts.warn}</Text>
        <Text className="font-inter-semibold text-[10px] text-ink">━ 정확 {counts.ok}</Text>
      </View>
    </View>
  );
}
