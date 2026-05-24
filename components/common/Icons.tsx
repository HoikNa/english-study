import React from 'react';
import Svg, { Path, Rect, Circle } from 'react-native-svg';

interface IconProps {
  color?: string;
  size?: number;
}

export function HomeIcon({ color = '#000', size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path d="M3 9.5L11 3.5L19 9.5V18.5C19 19.05 18.55 19.5 18 19.5H4C3.45 19.5 3 19.05 3 18.5V9.5Z"
        stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <Path d="M9 19.5V13H13V19.5" stroke={color} strokeWidth="1.6" />
    </Svg>
  );
}

export function GridIcon({ color = '#000', size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.6" />
      <Rect x="12" y="3" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.6" />
      <Rect x="3" y="12" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.6" />
      <Rect x="12" y="12" width="7" height="7" rx="1.5" stroke={color} strokeWidth="1.6" />
    </Svg>
  );
}

export function ReviewIcon({ color = '#000', size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path d="M3.5 11C3.5 6.86 6.86 3.5 11 3.5C13.5 3.5 15.7 4.7 17 6.5L19 4.5V10H13.5L15.5 8C14.5 6.5 12.85 5.5 11 5.5C7.96 5.5 5.5 7.96 5.5 11C5.5 14.04 7.96 16.5 11 16.5C13.3 16.5 15.27 15.1 16.1 13.1L18 13.8C16.85 16.45 14.15 18.5 11 18.5C6.86 18.5 3.5 15.14 3.5 11Z"
        fill={color} />
    </Svg>
  );
}

export function ChartIcon({ color = '#000', size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Path d="M3.5 18.5V8.5M9 18.5V3.5M14.5 18.5V11.5M20 18.5V6.5"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function MicIcon({ color = '#fff', size = 28 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <Rect x="10" y="4" width="8" height="14" rx="4" fill={color} />
      <Path d="M6 13C6 17 9.5 20 14 20C18.5 20 22 17 22 13"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <Path d="M14 20V24M10 24H18" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </Svg>
  );
}

export function PlayIcon({ color = '#fff', size = 22 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22">
      <Path d="M6 4.5V17.5L17 11L6 4.5Z" fill={color} />
    </Svg>
  );
}

export function ChevronIcon({ color = '#8A8278', size = 16, dir = 'right' }: IconProps & { dir?: 'right' | 'left' | 'down' | 'up' }) {
  const rotation = dir === 'right' ? 0 : dir === 'down' ? 90 : dir === 'left' ? 180 : 270;
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16"
      style={{ transform: [{ rotate: `${rotation}deg` }] }}>
      <Path d="M6 3L11 8L6 13" stroke={color} strokeWidth="1.6" fill="none"
        strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function CheckIcon({ color = '#5B7A5B', size = 16 }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <Path d="M3 8L6.5 11.5L13 5" stroke={color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
