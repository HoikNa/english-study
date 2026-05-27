import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { ActivityIndicator, View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeIcon, GridIcon, ChartIcon } from '@/components/common/Icons';
import { C } from '@/lib/theme';
import { useAuthStore } from '@/stores/auth.store';

type TabId = 'index' | 'categories' | 'progress';

const TABS: { id: TabId; label: string; Icon: React.FC<{ color: string; size?: number }> }[] = [
  { id: 'index', label: '오늘', Icon: HomeIcon },
  { id: 'categories', label: '학습', Icon: GridIcon },
  { id: 'progress', label: '진도', Icon: ChartIcon },
];

export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  const bottomClearance = Platform.OS === 'android' ? Math.max(insets.bottom, 48) : Math.max(insets.bottom, 16);
  const tabBarHeight = 66 + bottomClearance;
  const user = useAuthStore((state) => state.user);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isLoading = useAuthStore((state) => state.isLoading);

  if (!hasHydrated || isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={C.accent} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/onboarding" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            height: tabBarHeight,
            paddingBottom: bottomClearance,
          },
        ],
        tabBarBackground: () => (
          Platform.OS === 'ios'
            ? <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
            : <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(245,240,230,0.95)' }]} />
        ),
        tabBarActiveTintColor: C.ink,
        tabBarInactiveTintColor: C.muted2,
        tabBarItemStyle: styles.tabItem,
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
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.paper,
  },
  tabBar: {
    position: 'absolute',
    borderTopWidth: 0.5,
    borderTopColor: C.line,
    elevation: 0,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  tabItem: {
    paddingTop: 2,
  },
  label: {
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 0,
    fontFamily: 'InterSemiBold',
  },
});
