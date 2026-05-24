import React from 'react';
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { C, spacing } from '@/lib/theme';
import { ChevronIcon } from '@/components/common/Icons';
import { SectionLabel } from '@/components/common/SectionLabel';
import { useAuthStore } from '@/stores/auth.store';
import { useAudioStore } from '@/stores/audio.store';
import { USE_MOCK, BASE_URL, API_PREFIX } from '@/lib/api';

const SPEEDS = [0.75, 1.0, 1.2] as const;

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { playbackSpeed, setPlaybackSpeed } = useAudioStore();

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronIcon dir="left" color={C.ink} size={20} />
        </Pressable>
        <Text style={styles.title}>설정</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user?.name?.[0] ?? 'H'}</Text>
          </View>
          <View style={styles.profileText}>
            <Text style={styles.profileName}>{user?.name ?? 'Guest'}</Text>
            <Text style={styles.profileMeta}>Level {user?.level ?? 3} · SpeakReadyMY</Text>
          </View>
        </View>

        <View style={styles.section}>
          <SectionLabel style={styles.sectionLabel}>음성</SectionLabel>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>기본 TTS 보이스</Text>
              <Text style={styles.rowSub}>OpenAI Nova</Text>
            </View>
            <Text style={styles.value}>Nova</Text>
          </View>
          <View style={styles.rowBlock}>
            <Text style={styles.rowTitle}>기본 재생 속도</Text>
            <View style={styles.speedRow}>
              {SPEEDS.map((speed) => (
                <Pressable
                  key={speed}
                  style={[styles.speedBtn, playbackSpeed === speed && styles.speedBtnActive]}
                  onPress={() => setPlaybackSpeed(speed)}
                >
                  <Text style={[styles.speedText, playbackSpeed === speed && styles.speedTextActive]}>{speed}x</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <SectionLabel style={styles.sectionLabel}>개발 모드</SectionLabel>
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Mock 모드</Text>
              <Text style={styles.rowSub}>EXPO_PUBLIC_USE_MOCK</Text>
            </View>
            <Text style={[styles.value, { color: USE_MOCK ? C.sage : C.rose }]}>{USE_MOCK ? 'ON' : 'OFF'}</Text>
          </View>
          <View style={styles.rowBlock}>
            <Text style={styles.rowTitle}>API Base</Text>
            <Text style={styles.apiText}>{BASE_URL}{API_PREFIX}</Text>
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.75 }]}
          onPress={() => {
            logout();
            router.replace('/(auth)/onboarding');
          }}
        >
          <Text style={styles.logoutText}>로그아웃</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenH,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: C.line,
  },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 15, fontWeight: '700', textAlign: 'center', color: C.ink },
  topSpacer: { width: 28 },
  scroll: { padding: spacing.screenH, gap: 16 },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    backgroundColor: C.ink,
    borderRadius: 18,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 999,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  profileText: { flex: 1 },
  profileName: { color: C.paper, fontSize: 18, fontWeight: '700' },
  profileMeta: { color: 'rgba(245,240,230,0.62)', fontSize: 12, marginTop: 2 },
  section: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 0.5,
    borderColor: C.line,
    padding: 14,
  },
  sectionLabel: { marginBottom: 10 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  rowBlock: { paddingVertical: 10 },
  rowTitle: { fontSize: 14, fontWeight: '700', color: C.ink },
  rowSub: { fontSize: 11, color: C.muted, marginTop: 3 },
  value: { fontSize: 13, fontWeight: '800', color: C.ink, fontFamily: 'IBMPlexMonoSemiBold' },
  speedRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  speedBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: C.paper2,
    alignItems: 'center',
  },
  speedBtnActive: { backgroundColor: C.ink },
  speedText: { color: C.muted, fontSize: 12, fontWeight: '700', fontFamily: 'IBMPlexMonoSemiBold' },
  speedTextActive: { color: C.paper },
  apiText: { color: C.muted, fontSize: 12, marginTop: 6, fontFamily: 'IBMPlexMono' },
  logoutBtn: {
    padding: 15,
    borderRadius: 14,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
  },
  logoutText: { color: C.rose, fontWeight: '800', fontSize: 14 },
});
