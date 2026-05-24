import React from 'react';
import { View, StyleProp, ViewStyle } from 'react-native';
import { C, shadow, radius } from '@/lib/theme';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<ViewStyle>;
  padding?: number;
}

export function Card({ children, className, style, padding = 16 }: CardProps) {
  return (
    <View
      className={className}
      style={[
        {
          backgroundColor: C.card,
          borderRadius: radius.cardLg,
          borderWidth: 0.5,
          borderColor: C.line,
          padding,
          ...shadow.cardSubtle,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
