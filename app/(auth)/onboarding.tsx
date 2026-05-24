import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { C, shadow } from '@/lib/theme';
import { apiClient, USE_MOCK } from '@/lib/api';
import { useAuthStore, UserProfile } from '@/stores/auth.store';

const AI_CARDS = [
  { tag: 'Azure Speech', desc: '발음 정밀 평가 · 4항목 점수' },
  { tag: 'GPT-4o', desc: '표현 교정 · 대화 시뮬레이션' },
  { tag: 'OpenAI TTS', desc: '원어민 음성 생성 · Nova 보이스' },
];

interface AuthApiUser {
  id: string;
  email: string;
  nickname: string;
  level: 1 | 2 | 3 | 4;
}

interface AuthResponse {
  user: AuthApiUser;
  user_id: string;
  access_token: string;
}

function normalizeUser(user: AuthApiUser): UserProfile {
  return {
    id: user.id,
    name: user.nickname,
    email: user.email,
    level: user.level ?? 3,
  };
}

export default function OnboardingScreen() {
  const completeOnboarding = useAuthStore((state) => state.completeOnboarding);
  const setAuth = useAuthStore((state) => state.setAuth);
  const [mode, setMode] = useState<'register' | 'login'>('register');
  const [email, setEmail] = useState('hoik@example.com');
  const [password, setPassword] = useState('password123');
  const [nickname, setNickname] = useState('Hoik');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const enterMockApp = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const submitAuth = async () => {
    if (USE_MOCK) {
      enterMockApp();
      return;
    }

    setError(null);
    setIsSubmitting(true);
    try {
      const res = await apiClient.post<AuthResponse>(mode === 'register' ? '/auth/register' : '/auth/login', {
        email: email.trim(),
        password,
        nickname: mode === 'register' ? nickname.trim() : undefined,
      });
      setAuth(normalizeUser(res.data.user), res.data.access_token);
      router.replace('/(tabs)');
    } catch {
      setError(mode === 'register' ? '가입에 실패했어요. 이미 등록된 이메일인지 확인해 주세요.' : '로그인 정보를 확인해 주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.safe}>
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.logoRow}>
              <Text style={styles.logoBase}>SpeakReady</Text>
              <Text style={styles.logoAccent}>MY</Text>
            </View>

            <View style={styles.headlineBlock}>
              <Text style={styles.headline}>토익 850점은{'\n'}이미 가지고 있어요.</Text>
              <Text style={styles.headlineAccent}>이젠 입에서 나오게.</Text>
            </View>

            <View style={styles.authPanel}>
              <View style={styles.modeRow}>
                <Pressable
                  style={[styles.modeBtn, mode === 'register' && styles.modeBtnActive]}
                  onPress={() => setMode('register')}
                >
                  <Text style={[styles.modeText, mode === 'register' && styles.modeTextActive]}>가입</Text>
                </Pressable>
                <Pressable
                  style={[styles.modeBtn, mode === 'login' && styles.modeBtnActive]}
                  onPress={() => setMode('login')}
                >
                  <Text style={[styles.modeText, mode === 'login' && styles.modeTextActive]}>로그인</Text>
                </Pressable>
              </View>

              {mode === 'register' && (
                <TextInput
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="이름"
                  placeholderTextColor="rgba(245,240,230,0.38)"
                  style={styles.input}
                  autoCapitalize="words"
                />
              )}
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="이메일"
                placeholderTextColor="rgba(245,240,230,0.38)"
                style={styles.input}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
              />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="비밀번호"
                placeholderTextColor="rgba(245,240,230,0.38)"
                style={styles.input}
                autoCapitalize="none"
                autoComplete="password"
                secureTextEntry
              />

              {error && <Text style={styles.errorText}>{error}</Text>}

              <Pressable
                style={({ pressed }) => [
                  styles.ctaBtn,
                  shadow.micCta,
                  pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
                  isSubmitting && { opacity: 0.7 },
                ]}
                onPress={submitAuth}
                disabled={isSubmitting}
              >
                {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.ctaBtnText}>{mode === 'register' ? '계정 만들고 시작' : '로그인하고 계속'}</Text>}
              </Pressable>

              {USE_MOCK && (
                <Pressable style={({ pressed }) => [styles.skipBtn, pressed && { opacity: 0.6 }]} onPress={enterMockApp}>
                  <Text style={styles.skipText}>건너뛰고 생활영어 먼저 시작하기</Text>
                </Pressable>
              )}
            </View>

            <View style={styles.aiCards}>
              {AI_CARDS.map((card) => (
                <View key={card.tag} style={styles.aiCard}>
                  <View style={styles.aiTag}>
                    <Text style={styles.aiTagText}>{card.tag}</Text>
                  </View>
                  <Text style={styles.aiDesc}>{card.desc}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.ink },
  safe: { flex: 1 },
  scroll: { paddingHorizontal: 24, paddingTop: 32, paddingBottom: 40, flexGrow: 1 },

  logoRow: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 40 },
  logoBase: { fontSize: 18, fontWeight: '700', color: C.paper, fontFamily: 'InterBold', letterSpacing: 0 },
  logoAccent: { fontSize: 18, fontWeight: '700', color: C.accent, fontFamily: 'InterBold' },

  headlineBlock: { marginBottom: 26 },
  headline: {
    fontSize: 30, fontWeight: '700', color: C.paper,
    letterSpacing: 0, lineHeight: 38, fontFamily: 'InterBold',
  },
  headlineAccent: {
    fontSize: 30, color: C.accent,
    fontFamily: 'InstrumentSerifItalic', fontStyle: 'italic',
    marginTop: 4, lineHeight: 38,
  },

  authPanel: {
    gap: 10,
    marginBottom: 24,
    padding: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  modeRow: { flexDirection: 'row', gap: 8, marginBottom: 2 },
  modeBtn: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  modeBtnActive: { backgroundColor: C.paper },
  modeText: { color: 'rgba(245,240,230,0.62)', fontSize: 13, fontWeight: '700' },
  modeTextActive: { color: C.ink },
  input: {
    height: 46,
    borderRadius: 12,
    paddingHorizontal: 14,
    color: C.paper,
    backgroundColor: 'rgba(0,0,0,0.18)',
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.12)',
    fontSize: 14,
  },
  errorText: { color: C.accentSoft, fontSize: 12, lineHeight: 17 },
  ctaBtn: {
    minHeight: 52,
    padding: 16,
    backgroundColor: C.accent,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaBtnText: { fontSize: 15, fontWeight: '700', color: '#fff', fontFamily: 'InterBold' },
  skipBtn: { alignItems: 'center', paddingVertical: 4 },
  skipText: { fontSize: 13, color: 'rgba(245,240,230,0.5)' },

  aiCards: { gap: 10, marginTop: 'auto' as any },
  aiCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 14, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.12)',
  },
  aiTag: {
    paddingHorizontal: 10, paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 999,
  },
  aiTagText: { fontSize: 11, fontWeight: '700', color: C.paper, fontFamily: 'InterBold' },
  aiDesc: { fontSize: 13, color: 'rgba(245,240,230,0.7)', flex: 1 },
});
