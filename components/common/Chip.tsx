import React from 'react';
import { View, Text, StyleProp, ViewStyle, TextStyle } from 'react-native';
import { C } from '@/lib/theme';

interface ChipProps {
  children: React.ReactNode;
  className?: string;
  textClassName?: string;
  color?: string;
  bg?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

export function Chip({
  children,
  className,
  textClassName,
  color = C.ink,
  bg = C.paper2,
  style,
  textStyle,
}: ChipProps) {
  return (
    <View
      className={className}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 9,
          paddingVertical: 4,
          borderRadius: 999,
          backgroundColor: bg,
        },
        style,
      ]}
    >
      <Text
        className={textClassName}
        style={[
          {
            fontSize: 11,
            fontWeight: '600',
            letterSpacing: -0.1,
            color,
          },
          textStyle,
        ]}
      >
        {children}
      </Text>
    </View>
  );
}
