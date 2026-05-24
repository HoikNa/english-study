import React from 'react';
import { Text, StyleProp, TextStyle } from 'react-native';
import { C } from '@/lib/theme';

interface SectionLabelProps {
  children: React.ReactNode;
  className?: string;
  style?: StyleProp<TextStyle>;
  light?: boolean;
}

export function SectionLabel({ children, className, style, light }: SectionLabelProps) {
  return (
    <Text
      className={className}
      style={[
        {
          fontSize: 11,
          fontWeight: '700',
          color: light ? 'rgba(245,240,230,0.5)' : C.muted,
          letterSpacing: 1.1,
        },
        style,
      ]}
    >
      {typeof children === 'string' ? children.toUpperCase() : children}
    </Text>
  );
}
