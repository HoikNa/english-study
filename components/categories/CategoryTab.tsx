import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface CategoryTabItem<T extends string> {
  id: T;
  label: string;
  count: number;
}

interface CategoryTabProps<T extends string> {
  tabs: readonly CategoryTabItem<T>[];
  active: T;
  onSelect: (id: T) => void;
}

export function CategoryTab<T extends string>({ tabs, active, onSelect }: CategoryTabProps<T>) {
  return (
    <View className="flex-row gap-1.5 px-screen pb-4">
      {tabs.map((tab) => {
        const isActive = tab.id === active;

        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className={`flex-row items-center gap-1.5 rounded-full px-3.5 py-2 ${isActive ? 'bg-ink' : 'border border-line bg-transparent'}`}
            onPress={() => onSelect(tab.id)}
          >
            <Text className={`font-inter-semibold text-[13px] ${isActive ? 'text-paper' : 'text-muted'}`}>
              {tab.label}
            </Text>
            <Text className={`font-mono text-[10px] ${isActive ? 'text-paper/60' : 'text-muted-2'}`}>
              {tab.count}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
