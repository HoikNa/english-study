import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, SafeAreaView, TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { C, spacing } from '@/lib/theme';
import { Chip } from '@/components/common/Chip';
import { MicIcon, ChevronIcon } from '@/components/common/Icons';
import { ChatBubble } from '@/components/simulate/ChatBubble';
import { SuggestionPill } from '@/components/simulate/SuggestionPill';

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

const INITIAL_MESSAGES: Message[] = [
  {
    id: '1', who: 'ai',
    text: "Thanks for coming in. So I hear you've built telecom IoT platforms back in Korea — what's your take on integrating with our edge stack?",
    time: '14:02',
  },
  {
    id: '2', who: 'me',
    text: "Yes, I have built IoT platform for 5G. Our system can connect with your edge.",
    time: '14:03',
    coachNote: {
      from: "I have built IoT platform",
      to: "I've led IoT platform development",
      why: '경험·역량 어필 시 주도성 강조',
    },
  },
  {
    id: '3', who: 'ai',
    text: "Got it. What kind of latency are we talking about for sensor-to-cloud round-trips on your platform?",
    time: '14:03',
  },
];

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

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState('');
  const scrollRef = useRef<ScrollView>(null);
  const replyTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const [elapsed] = useState('3분 32초');

  useEffect(() => () => {
    replyTimersRef.current.forEach(clearTimeout);
    replyTimersRef.current = [];
  }, []);

  function send(text?: string) {
    const t = (text ?? input).trim();
    if (!t) return;
    setInput('');

    const myMsg: Message = { id: Date.now().toString(), who: 'me', text: t, time: now() };
    setMessages((prev) => [...prev, myMsg]);

    const replyTimer = setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        who: 'ai',
        text: "Interesting point. Could you walk me through how your platform handles data ingestion at scale?",
        time: now(),
      };
      setMessages((prev) => [...prev, aiMsg]);
      scrollRef.current?.scrollToEnd({ animated: true });
      replyTimersRef.current = replyTimersRef.current.filter((timer) => timer !== replyTimer);
    }, 1500);
    replyTimersRef.current = [...replyTimersRef.current, replyTimer];

    scrollRef.current?.scrollToEnd({ animated: true });
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
      </ScrollView>

      {/* Composer */}
      <View style={styles.composer}>
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
            style={({ pressed }) => [styles.micBtn, pressed && { opacity: 0.8, transform: [{ scale: 0.94 }] }]}
            onPress={() => send()}
          >
            <MicIcon size={18} color="#fff" />
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
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 12, paddingVertical: 10,
    backgroundColor: C.card, borderRadius: 22,
    borderWidth: 0.5, borderColor: C.line,
  },
  input: { flex: 1, fontSize: 13, color: C.ink },
  micBtn: {
    width: 36, height: 36, borderRadius: 999,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
  },
});
