import React from 'react';
import { Text, View } from 'react-native';

interface ChunkHighlightProps {
  chunks: string[];
  activeIndex: number;
  completedIndexes: ReadonlySet<number>;
}

export function ChunkHighlight({ chunks, activeIndex, completedIndexes }: ChunkHighlightProps) {
  return (
    <View className="mb-3 flex-row flex-wrap gap-1">
      {chunks.map((chunk, index) => {
        const isActive = index === activeIndex;
        const isCompleted = completedIndexes.has(index);
        const colorClass = isCompleted ? 'text-sage' : isActive ? 'text-ink' : 'text-muted-2';

        return (
          <Text
            key={`${chunk}-${index}`}
            className={`rounded-md font-inter-semibold text-[17px] ${colorClass} ${isActive ? 'bg-gold-soft px-1' : ''}`}
          >
            {chunk}
            {index < chunks.length - 1 && <Text className="text-line"> · </Text>}
          </Text>
        );
      })}
    </View>
  );
}
