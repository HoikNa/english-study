import React from 'react';
import { Pressable, Text, View } from 'react-native';

interface AudioSpeedPickerProps<T extends number> {
  speeds: readonly T[];
  selected: T;
  onChange: (speed: T) => void;
}

export function AudioSpeedPicker<T extends number>({ speeds, selected, onChange }: AudioSpeedPickerProps<T>) {
  return (
    <View className="flex-row justify-center gap-2">
      {speeds.map((speed) => {
        const isSelected = selected === speed;

        return (
          <Pressable
            key={speed}
            accessibilityRole="button"
            accessibilityState={{ selected: isSelected }}
            className={`rounded-full px-4 py-2 ${isSelected ? 'bg-ink' : 'bg-paper-2'}`}
            onPress={() => onChange(speed)}
          >
            <Text className={`font-mono-semibold text-xs ${isSelected ? 'text-paper' : 'text-muted'}`}>
              {speed}x
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
