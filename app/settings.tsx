import React from 'react';
import { Alert, Pressable, SafeAreaView, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { C, spacing } from '@/lib/theme';
import { ChevronIcon } from '@/components/common/Icons';
import { SectionLabel } from '@/components/common/SectionLabel';
import { useAuthStore } from '@/stores/auth.store';
import { useAudioStore } from '@/stores/audio.store';
import { USE_MOCK, BASE_URL, API_PREFIX, apiClient, getApiErrorMessage } from '@/lib/api';
import { captureSentryMessage, isSentryEnabled } from '@/lib/sentry';

const SPEEDS = [0.75, 1.0, 1.2] as const;

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { playbackSpeed, setPlaybackSpeed } = useAudioStore();
  const [isLoggingOut, setIsLoggingOut] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleSentryTest = () => {
    const eventId = captureSentryMessage(`SpeakReadyMY mobile Sentry probe ${new Date().toISOString()}`);
    Alert.alert('Sentry 테스트', eventId ? `전송됨: ${eventId}` : 'Sentry DSN이 설정되지 않았어요.');
  };

  const handleLogout = async () => {
    if (isLoggingOut) {
      return;
    }

    setIsLoggingOut(true);
    try {
      if (!USE_MOCK) {
        await apiClient.post('/auth/logout');
      }
    } catch (err) {
      console.error('[Logout Error]', err);
    } finally {
      logout();
      setIsLoggingOut(false);
      router.replace('/(auth)/onboarding');
    }
  };

  const handleExport = async () => {
    if (isExporting) {
      return;
    }

    setIsExporting(true);
    try {
      if (USE_MOCK) {
        await Share.share({
          title: 'SpeakReadyMY 데이터',
          message: JSON.stringify({ user, sessions: [], review_queue: [] }, null, 2),
        });
        return;
      }

      const res = await apiClient.get('/auth/me/export');
      await Share.share({
        title: 'SpeakReadyMY 데이터',
        message: JSON.stringify(res.data, null, 2),
      });
    } catch (err) {
      Alert.alert('내보내기 실패', getApiErrorMessage(err));
    } finally {
      setIsExporting(false);
    }
  };

  const confirmDeleteAccount = () => {
    if (isDeleting) {
      return;
    }

    Alert.alert(
      '계정을 삭제할까요?',
      '학습 기록과 복습 큐가 삭제되고 현재 기기에서 로그아웃됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: handleDeleteAccount,
        },
      ],
    );
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      if (!USE_MOCK) {
        await apiClient.delete('/auth/me');
      }
      logout();
      router.replace('/(auth)/onboarding');
    } catch (err) {
      Alert.alert('계정 삭제 실패', getApiErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  };

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
          <View style={styles.row}>
            <View>
              <Text style={styles.rowTitle}>Sentry</Text>
              <Text style={styles.rowSub}>EXPO_PUBLIC_SENTRY_DSN</Text>
            </View>
            <Text style={[styles.value, { color: isSentryEnabled ? C.sage : C.rose }]}>
              {isSentryEnabled ? 'ON' : 'OFF'}
            </Text>
          </View>
          {__DEV__ && (
            <Pressable style={styles.debugAction} onPress={handleSentryTest}>
              <Text style={styles.debugActionText}>Sentry 테스트 전송</Text>
            </Pressable>
          )}
        </View>

        <View style={styles.section}>
          <SectionLabel style={styles.sectionLabel}>계정 데이터</SectionLabel>
          <Pressable
            disabled={isExporting}
            style={({ pressed }) => [styles.accountAction, (pressed || isExporting) && { opacity: 0.75 }]}
            onPress={handleExport}
          >
            <View>
              <Text style={styles.rowTitle}>내 데이터 내보내기</Text>
              <Text style={styles.rowSub}>프로필, 학습 기록, 복습 큐</Text>
            </View>
            <Text style={styles.actionText}>{isExporting ? '준비 중' : '공유'}</Text>
          </Pressable>
          <Pressable
            disabled={isDeleting}
            style={({ pressed }) => [styles.deleteAction, (pressed || isDeleting) && { opacity: 0.75 }]}
            onPress={confirmDeleteAccount}
          >
            <View>
              <Text style={[styles.rowTitle, { color: C.rose }]}>계정 삭제</Text>
              <Text style={styles.rowSub}>계정과 학습 데이터를 삭제</Text>
            </View>
            <Text style={styles.deleteText}>{isDeleting ? '삭제 중' : '삭제'}</Text>
          </Pressable>
        </View>

        <Pressable
          disabled={isLoggingOut}
          style={({ pressed }) => [styles.logoutBtn, (pressed || isLoggingOut) && { opacity: 0.75 }]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>{isLoggingOut ? '로그아웃 중' : '로그아웃'}</Text>
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
  accountAction: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: C.line,
  },
  deleteAction: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
  },
  actionText: { color: C.sage, fontSize: 13, fontWeight: '800' },
  deleteText: { color: C.rose, fontSize: 13, fontWeight: '800' },
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
  debugAction: {
    marginTop: 8,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: C.ink,
    alignItems: 'center',
  },
  debugActionText: { color: C.paper, fontSize: 12, fontWeight: '800' },
  logoutBtn: {
    padding: 15,
    borderRadius: 14,
    backgroundColor: C.accentSoft,
    alignItems: 'center',
  },
  logoutText: { color: C.rose, fontWeight: '800', fontSize: 14 },
});
