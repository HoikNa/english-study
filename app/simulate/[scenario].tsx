import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator, View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { C, spacing } from '@/lib/theme';
import { Chip } from '@/components/common/Chip';
import { MicIcon, ChevronIcon } from '@/components/common/Icons';
import { ChatBubble } from '@/components/simulate/ChatBubble';
import { SuggestionPill } from '@/components/simulate/SuggestionPill';
import { ScreenState } from '@/components/common/ScreenState';
import { useStartSimulation, useSendSimulationMessage } from '@/hooks/useSimulation';

interface Message {
  id: string;
  who: 'ai' | 'me';
  text: string;
  time: string;
  coachNote?: { from: string; to: string; why: string } | null;
}

const SCENARIOS: Record<string, { name: string; brief: string; avatar: string }> = {
  'iot-meeting': {
    name: 'Marcus · CTO',
    brief: 'IoT 통합 첫 미팅. 회사 역량과 레이턴시·아키텍처 강점을 설득력 있게 전달하세요.',
    avatar: 'M',
  },
  'requirements': {
    name: 'Sarah · PM',
    brief: '요구사항 협의. 수락 조건을 명확히 하고 이해관계자 기대치를 조율하세요.',
    avatar: 'S',
  },
};

const SUGGESTIONS = [
  '"Our latency stays under 50ms..."',
  '"From an architectural standpoint..."',
  '"Let me elaborate on..."',
];

function now() {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

export default function SimulateScreen() {
  const { scenario = 'iot-meeting' } = useLocalSearchParams<{ scenario: string }>();
  const info = SCENARIOS[scenario] ?? SCENARIOS['iot-meeting'];
  const startSimulation = useStartSimulation();
  const sendMessage = useSendSimulationMessage();

  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const [elapsed] = useState('3분 32초');
  const [isBootstrapped, setIsBootstrapped] = useState(false);
  const [startAttempt, setStartAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      setIsBootstrapped(false);
      setMessages([]);
      setSimulationId(null);
      startSimulation.reset();
      sendMessage.reset();

      try {
        const result = await startSimulation.mutateAsync(scenario);
        if (cancelled) return;
        setSimulationId(result.simulationId);
        setMessages([{
          id: 'ai-1',
          who: 'ai',
          text: result.firstMessage,
          time: now(),
        }]);
      } catch {
        // handled below via mutation state
      } finally {
        if (!cancelled) setIsBootstrapped(true);
      }
    }

    bootstrap();

    return () => {
      cancelled = true;
    };
  }, [scenario, startAttempt]);

  const loading = startSimulation.isPending || !isBootstrapped;
  const startError = startSimulation.error;
  const sendError = sendMessage.error;
  const canSend = Boolean(input.trim()) && Boolean(simulationId) && !sendMessage.isPending;

  const historyPayload = useMemo(
    () => messages.map((message) => ({
      who: message.who,
      text: message.text,
      time: message.time,
      coachNote: message.coachNote ?? null,
    })),
    [messages],
  );

  async function send(text?: string) {
    const t = (text ?? input).trim();
    if (!t || !simulationId || sendMessage.isPending) return;
    sendMessage.reset();
    setInput('');

    const myMsg: Message = { id: Date.now().toString(), who: 'me', text: t, time: now() };
    setMessages((prev) => [...prev, myMsg]);
    scrollRef.current?.scrollToEnd({ animated: true });

    try {
      const reply = await sendMessage.mutateAsync({
        simulationId,
        message: t,
        history: [...historyPayload, { who: 'me', text: t, time: myMsg.time, coachNote: null }],
      });
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        who: 'ai',
        text: reply.reply,
        time: now(),
        coachNote: reply.coachCommentKo
          ? { from: t, to: reply.reply, why: reply.coachCommentKo }
          : null,
      };
      setMessages((prev) => [...prev, aiMsg]);
      scrollRef.current?.scrollToEnd({ animated: true });
    } catch {
      setInput(t);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenState
          loading
          title="시뮬레이션을 여는 중"
          message="롤플레이 세션을 시작하고 있어요."
        />
      </SafeAreaView>
    );
  }

  if (startError) {
    return (
      <SafeAreaView style={styles.safe}>
        <ScreenState
          title="시뮬레이션을 불러오지 못했어요"
          message="백엔드 연결을 확인한 뒤 다시 시도해 주세요."
          actionLabel="다시 시도"
          onAction={() => {
            startSimulation.reset();
            sendMessage.reset();
            setStartAttempt((attempt) => attempt + 1);
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ChevronIcon dir="left" color={C.ink} size={20} />
        </Pressable>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{info.avatar}</Text>
        </View>
        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.name}>{info.name}</Text>
            <View style={styles.onlineDot} />
          </View>
          <Text style={styles.scenario}>{scenario}</Text>
        </View>
        <Chip color={C.muted} bg={C.paper2}>{elapsed}</Chip>
      </View>

      {/* Scenario brief */}
      <View style={styles.briefWrap}>
        <View style={styles.briefCard}>
          <Text style={styles.briefText}>
            <Text style={styles.briefBold}>시나리오</Text> · {info.brief}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.messages}
        showsVerticalScrollIndicator={false}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}
      >
        {messages.map((message) => (
          <ChatBubble
            key={message.id}
            who={message.who}
            text={message.text}
            time={message.time}
            avatar={info.avatar}
            coachNote={message.coachNote}
          />
        ))}
        {sendMessage.isPending && (
          <ChatBubble
            who="ai"
            text="답변을 준비하고 있어요..."
            time={now()}
            avatar={info.avatar}
          />
        )}
      </ScrollView>

      {/* Composer */}
      <View style={styles.composer}>
        {sendError && (
          <View style={styles.composerError}>
            <Text style={styles.composerErrorText}>메시지를 보내지 못했어요. 다시 시도해 주세요.</Text>
          </View>
        )}

        {/* Suggestions */}
        <ScrollView
          horizontal showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestScroll}
        >
          {SUGGESTIONS.map((suggestion) => (
            <SuggestionPill key={suggestion} text={suggestion} onPress={() => send(suggestion)} />
          ))}
        </ScrollView>

        {/* Input row */}
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="탭해서 말하기..."
            placeholderTextColor={C.muted2}
            onSubmitEditing={() => send()}
            returnKeyType="send"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={input.trim() ? '메시지 보내기' : '음성 입력'}
            style={({ pressed }) => [
              styles.sendBtn,
              !canSend && styles.sendBtnDisabled,
              pressed && canSend && { opacity: 0.8, transform: [{ scale: 0.94 }] },
            ]}
            onPress={() => send()}
            disabled={!canSend}
          >
            {sendMessage.isPending ? (
              <ActivityIndicator color="#fff" />
            ) : input.trim() ? (
              <ChevronIcon color="#fff" size={18} />
            ) : (
              <MicIcon size={18} color="#fff" />
            )}
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1ECDF' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: spacing.screenH, paddingVertical: 10,
    backgroundColor: C.paper, borderBottomWidth: 0.5, borderBottomColor: C.line,
  },
  backBtn: { padding: 4 },
  avatar: {
    width: 34, height: 34, borderRadius: 999,
    backgroundColor: C.indigoSoft, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 12, fontWeight: '700', color: C.indigo },
  headerInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { fontSize: 13, fontWeight: '700' },
  onlineDot: { width: 6, height: 6, borderRadius: 999, backgroundColor: C.sage },
  scenario: { fontSize: 10, color: C.muted, marginTop: 1 },

  briefWrap: { paddingHorizontal: spacing.screenH, paddingTop: 12, paddingBottom: 6 },
  briefCard: {
    padding: 10, backgroundColor: C.indigoSoft, borderRadius: 10,
  },
  briefText: { fontSize: 11, color: C.indigo, lineHeight: 16 },
  briefBold: { fontWeight: '700' },

  messages: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 200, gap: 10 },

  composer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingBottom: 36,
    paddingTop: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(241,236,223,0)',
  },
  suggestScroll: { gap: 6, paddingBottom: 10 },
  composerError: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: C.accentSoft,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: C.rose + '55',
  },
  composerErrorText: { fontSize: 11, color: C.rose, fontWeight: '600' },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: C.card, borderRadius: 22,
    borderWidth: 0.5, borderColor: C.line,
  },
  input: { flex: 1, fontSize: 13, color: C.ink },
  sendBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
  },
  sendBtnDisabled: { backgroundColor: C.muted2 },
});
