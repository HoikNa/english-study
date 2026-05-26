import React, { useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView, TextInput, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useQueryClient } from '@tanstack/react-query';
import { C, spacing, shadow } from '@/lib/theme';
import { ChevronIcon, CheckIcon } from '@/components/common/Icons';
import { SectionLabel } from '@/components/common/SectionLabel';
import { Card } from '@/components/common/Card';
import { USE_MOCK, apiClient } from '@/lib/api';
import { ToneOption, ToneOptionCard } from '@/components/custom/ToneOptionCard';
import { learningKeys } from '@/hooks/useLearningData';

const MOCK_TONES: ToneOption[] = [
  {
    id: 'direct',
    label: 'Direct',
    labelKo: '직접적',
    text: "I need to push back on this timeline — it's not realistic given our current capacity.",
    note: '협상력 있고 단호한 톤',
  },
  {
    id: 'diplomatic',
    label: 'Diplomatic',
    labelKo: '외교적',
    text: "I'd like to revisit the timeline — I have some concerns about our capacity to deliver by then.",
    note: '관계를 유지하면서 우려를 전달',
  },
  {
    id: 'concise',
    label: 'Concise',
    labelKo: '간결한',
    text: "The timeline needs adjustment — we're at capacity.",
    note: '바쁜 미팅에서 빠르게 핵심 전달',
  },
];

export default function CustomAddScreen() {
  const queryClient = useQueryClient();
  const [koreanInput, setKoreanInput] = useState('');
  const [contextInput, setContextInput] = useState('');
  const [tones, setTones] = useState<ToneOption[] | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateTones() {
    if (!koreanInput.trim()) return;
    setLoading(true);
    setTones(null);
    setSelected(null);
    setError(null);

    try {
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 1200));
        setTones(MOCK_TONES);
      } else {
        const res = await apiClient.post<{ text_en: string; situation_desc_ko: string }>('/ai/custom-expression', {
          text_ko: koreanInput,
          context: contextInput,
        });
        setTones([
          {
            id: 'direct',
            label: 'Generated',
            labelKo: 'AI 변환',
            text: res.data.text_en,
            note: res.data.situation_desc_ko,
          },
        ]);
      }
    } catch {
      setError('AI 변환에 실패했어요. API 설정과 네트워크를 확인해 주세요.');
    } finally {
      setLoading(false);
    }
  }

  async function addToQueue() {
    if (!selected) return;
    setIsAdding(true);
    setError(null);

    try {
      const selectedTone = tones?.find((tone) => tone.id === selected);
      if (USE_MOCK) {
        await new Promise((r) => setTimeout(r, 500));
      } else {
        await apiClient.post('/expressions/custom', {
          text_ko: koreanInput.trim(),
          context: contextInput.trim() || undefined,
          text_en: selectedTone?.text,
          situation_desc_ko: selectedTone?.note,
          level: 3,
          category: 'custom',
        });
        queryClient.invalidateQueries({ queryKey: learningKeys.expressions({}) });
        queryClient.invalidateQueries({ queryKey: learningKeys.progress });
      }

      setAdded(true);
      setTimeout(() => router.back(), 800);
    } catch {
      setError('학습 큐에 추가하지 못했어요. 잠시 후 다시 시도해 주세요.');
    } finally {
      setIsAdding(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronIcon dir="left" color={C.ink} size={20} />
        </Pressable>
        <Text style={styles.title}>내 표현 만들기</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Input card */}
        <Card padding={16} style={styles.section}>
          <SectionLabel style={{ marginBottom: 10 }}>한국어로 말하고 싶은 것</SectionLabel>
          <TextInput
            style={styles.mainInput}
            value={koreanInput}
            onChangeText={setKoreanInput}
            placeholder="예: 이 일정은 현실적으로 불가능해요..."
            placeholderTextColor={C.muted2}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />

          <View style={styles.divider} />

          <SectionLabel style={{ marginBottom: 8 }}>상황 / 맥락 (선택)</SectionLabel>
          <TextInput
            style={styles.contextInput}
            value={contextInput}
            onChangeText={setContextInput}
            placeholder="예: 미국 파트너사와의 프로젝트 킥오프 미팅"
            placeholderTextColor={C.muted2}
          />

          <Pressable
            style={({ pressed }) => [
              styles.generateBtn,
              !koreanInput.trim() && styles.generateBtnDisabled,
              pressed && { opacity: 0.85 },
            ]}
            onPress={generateTones}
            disabled={!koreanInput.trim() || loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.generateBtnText}>AI 변환 →</Text>
            )}
          </Pressable>
          {error && <Text style={styles.errorText}>{error}</Text>}
        </Card>

        {/* Tone options */}
        {tones && (
          <View style={styles.section}>
            <SectionLabel style={{ marginHorizontal: spacing.screenH, marginBottom: 12 }}>
              톤 선택
            </SectionLabel>

            {tones.map((tone) => (
              <ToneOptionCard
                key={tone.id}
                tone={tone}
                selected={selected === tone.id}
                onPress={() => setSelected(tone.id)}
              />
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* CTA */}
      {selected && (
        <View style={styles.ctaWrap}>
          <Pressable
            style={({ pressed }) => [styles.ctaBtn, added && styles.ctaBtnDone, pressed && { opacity: 0.9 }]}
            onPress={addToQueue}
            disabled={isAdding || added}
          >
            {isAdding ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : added ? (
              <View style={styles.ctaInner}>
                <CheckIcon size={18} color="#fff" />
                <Text style={styles.ctaBtnText}>추가됨</Text>
              </View>
            ) : (
              <Text style={styles.ctaBtnText}>학습 큐에 추가 →</Text>
            )}
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.paper },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.screenH, paddingVertical: 12,
    borderBottomWidth: 0.5, borderBottomColor: C.line,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 15, fontWeight: '700', color: C.ink },

  scroll: { paddingTop: 20, paddingBottom: 40 },
  section: { marginHorizontal: spacing.screenH, marginBottom: 20 },

  mainInput: {
    fontSize: 15, color: C.ink, lineHeight: 22,
    minHeight: 72,
  },
  divider: { height: 0.5, backgroundColor: C.line, marginVertical: 14 },
  contextInput: { fontSize: 13, color: C.ink, paddingVertical: 2 },

  generateBtn: {
    marginTop: 16, paddingVertical: 13, borderRadius: 14,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
    ...shadow.cardFloat,
  },
  generateBtnDisabled: { backgroundColor: C.muted2 },
  generateBtnText: { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: 0.2 },
  errorText: { marginTop: 10, fontSize: 12, color: C.accent, lineHeight: 18 },

  ctaWrap: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: spacing.screenH, paddingBottom: 40, paddingTop: 16,
    backgroundColor: 'rgba(245,240,230,0.95)',
    borderTopWidth: 0.5, borderTopColor: C.line,
  },
  ctaBtn: {
    paddingVertical: 16, borderRadius: 16,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
    ...shadow.cardFloat,
  },
  ctaBtnDone: { backgroundColor: C.sage },
  ctaInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ctaBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
