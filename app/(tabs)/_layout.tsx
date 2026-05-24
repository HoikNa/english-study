import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { HomeIcon, GridIcon, ReviewIcon, ChartIcon } from '@/components/common/Icons';
import { C } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth.store';

type TabId = 'index' | 'categories' | 'review' | 'progress';

const TABS: { id: TabId; label: string; Icon: React.FC<{ color: string; size?: number }> }[] = [
  { id: 'index', label: '오늘', Icon: HomeIcon },
  { id: 'categories', label: '카테고리', Icon: GridIcon },
  { id: 'review', label: '복습', Icon: ReviewIcon },
  { id: 'progress', label: '진도', Icon: ChartIcon },
];

export default function TabsLayout() {
  const user = useAuthStore((state) => state.user);

  if (!user) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          Platform.OS === 'ios'
            ? <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
            : <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(245,240,230,0.95)' }]} />
        ),
        tabBarActiveTintColor: C.ink,
        tabBarInactiveTintColor: C.muted2,
        tabBarLabelStyle: styles.label,
      }}
    >
      {TABS.map(({ id, label, Icon }) => (
        <Tabs.Screen
          key={id}
          name={id}
          options={{
            title: label,
            tabBarIcon: ({ color }) => <Icon color={color as string} />,
          }}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0.5,
    borderTopColor: C.line,
    elevation: 0,
    height: 80,
    paddingBottom: 28,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: -0.1,
    fontFamily: 'InterSemiBold',
  },
});
