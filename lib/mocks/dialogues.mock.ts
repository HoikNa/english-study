import type { Dialogue } from '@/types';

export const mockDialogues: Dialogue[] = [
  {
    id: 'dlg-001',
    situationKo: 'IT 파트너십 첫 미팅 오프닝',
    situationEn: 'Opening of an IT partnership meeting',
    category: 'business',
    level: 3,
    speakerAVoice: 'echo',
    speakerBVoice: 'fable',
    speakerAName: 'Marcus',
    speakerBName: 'You',
    turns: [
      {
        id: 't1',
        speaker: 'A',
        textEn: 'Thanks for making time today, Hoik. How was your flight in?',
        textKo: '오늘 시간 내주셔서 감사해요, 호익. 비행은 어떠셨어요?',
      },
      {
        id: 't2',
        speaker: 'B',
        textEn: "Pretty smooth, thanks. Glad to finally meet you in person.",
        textKo: '괜찮았어요, 감사해요. 드디어 직접 뵙게 되어 반갑네요.',
      },
      {
        id: 't3',
        speaker: 'A',
        textEn: "Same here. So, you're leading product planning on the IoT side, right?",
        textKo: '저도요. 그러면 IoT 쪽 제품 기획을 리드하고 계신 거 맞죠?',
      },
      {
        id: 't4',
        speaker: 'B',
        textEn: "Yes, that's right. I'd like to walk you through our IoT platform briefly.",
        textKo: '맞아요. 저희 IoT 플랫폼에 대해 간략히 설명드리겠습니다.',
        expressionId: 'exp-011',
      },
      {
        id: 't5',
        speaker: 'A',
        textEn: "Please, go ahead. I'm interested to hear what your team has built.",
        textKo: '말씀해 주세요. 팀에서 어떤 걸 만드셨는지 듣고 싶네요.',
      },
      {
        id: 't6',
        speaker: 'B',
        textEn: 'We focus on low-latency edge processing tailored for telecom carriers.',
        textKo: '저희는 통신사 맞춤형 저지연 엣지 프로세싱에 집중하고 있어요.',
      },
      {
        id: 't7',
        speaker: 'A',
        textEn: "Interesting. What kind of latency are we talking about?",
        textKo: '흥미롭네요. 지연시간이 어느 정도 수준인가요?',
      },
    ],
  },
];

// 추가 dialogues
mockDialogues.push(
  {
    id: 'dlg-002',
    situationKo: '집 계약 / 렌트 문의',
    situationEn: 'Apartment lease inquiry',
    category: 'life',
    level: 2,
    speakerAVoice: 'alloy',
    speakerBVoice: 'onyx',
    speakerAName: 'Agent',
    speakerBName: 'You',
    turns: [
      {
        id: 't1',
        speaker: 'A',
        textEn: "Welcome! I'll show you around the unit. Any questions before we start?",
        textKo: '환영합니다! 유닛 안내해 드릴게요. 시작 전에 궁금한 점 있으세요?',
      },
      {
        id: 't2',
        speaker: 'B',
        textEn: 'Just a couple — what utilities are included in the rent?',
        textKo: '몇 가지요 — 임대료에 어떤 공과금이 포함되어 있나요?',
        expressionId: 'exp-001',
      },
      {
        id: 't3',
        speaker: 'A',
        textEn: 'Water and trash are included, but electricity and gas are billed separately.',
        textKo: '수도와 쓰레기 처리는 포함되어 있고, 전기랑 가스는 따로 청구돼요.',
      },
      {
        id: 't4',
        speaker: 'B',
        textEn: 'Got it. Is there a security deposit, and how much is it?',
        textKo: '알겠습니다. 보증금이 있나요? 얼마인가요?',
        expressionId: 'exp-002',
      },
      {
        id: 't5',
        speaker: 'A',
        textEn: "Yes, it's one month's rent, fully refundable when you move out.",
        textKo: '네, 한 달치 임대료이고 이사 나갈 때 전액 환급됩니다.',
      },
      {
        id: 't6',
        speaker: 'B',
        textEn: 'That makes sense. How soon can I move in if I apply today?',
        textKo: '이해됐어요. 오늘 신청하면 언제 입주 가능한가요?',
      },
      {
        id: 't7',
        speaker: 'A',
        textEn: "Usually within a week, once the background check clears.",
        textKo: '보통 일주일 이내요, 신원 조회만 통과되면.',
      },
    ],
  },
  {
    id: 'dlg-003',
    situationKo: '병원 진료 — 증상 설명',
    situationEn: 'Medical visit — describing symptoms',
    category: 'life',
    level: 2,
    speakerAVoice: 'shimmer',
    speakerBVoice: 'echo',
    speakerAName: 'Doctor',
    speakerBName: 'You',
    turns: [
      {
        id: 't1',
        speaker: 'A',
        textEn: 'Hi, what brings you in today?',
        textKo: '안녕하세요, 오늘 어떻게 오셨어요?',
      },
      {
        id: 't2',
        speaker: 'B',
        textEn: "I've had a persistent cough for about a week.",
        textKo: '약 일주일째 기침이 계속되고 있어요.',
        expressionId: 'exp-003',
      },
      {
        id: 't3',
        speaker: 'A',
        textEn: 'Any fever or shortness of breath along with it?',
        textKo: '함께 열이나 숨이 차는 증상도 있나요?',
      },
      {
        id: 't4',
        speaker: 'B',
        textEn: 'A mild fever the first two days, but no breathing issues.',
        textKo: '처음 이틀은 미열이 있었지만 호흡 문제는 없어요.',
      },
      {
        id: 't5',
        speaker: 'A',
        textEn: "Let me listen to your lungs. … Sounds clear. I'll prescribe a cough suppressant.",
        textKo: '폐 소리 좀 들어볼게요. … 깨끗하네요. 진해제 처방해 드릴게요.',
      },
      {
        id: 't6',
        speaker: 'B',
        textEn: 'Thanks. Could you explain how often I should take this medication?',
        textKo: '감사합니다. 이 약을 얼마나 자주 복용해야 하는지 설명해 주시겠어요?',
        expressionId: 'exp-004',
      },
      {
        id: 't7',
        speaker: 'A',
        textEn: 'Twice a day after meals, for the next five days.',
        textKo: '하루 두 번, 식후에 5일간 복용하세요.',
      },
    ],
  },
  {
    id: 'dlg-004',
    situationKo: '자녀 학교 상담',
    situationEn: 'Parent-teacher conference',
    category: 'life',
    level: 2,
    speakerAVoice: 'onyx',
    speakerBVoice: 'alloy',
    speakerAName: 'Teacher',
    speakerBName: 'You',
    turns: [
      {
        id: 't1',
        speaker: 'A',
        textEn: "Thanks for coming in. Your child's been settling in nicely.",
        textKo: '와주셔서 감사해요. 아이가 잘 적응하고 있어요.',
      },
      {
        id: 't2',
        speaker: 'B',
        textEn: "That's great to hear. I'd like to understand how my child is adjusting in class.",
        textKo: '다행이네요. 아이가 수업에 어떻게 적응하고 있는지 알고 싶습니다.',
        expressionId: 'exp-005',
      },
      {
        id: 't3',
        speaker: 'A',
        textEn: 'He participates more each week and has made a couple of close friends.',
        textKo: '매주 더 적극적으로 참여하고, 가까운 친구도 두어 명 사귀었어요.',
      },
      {
        id: 't4',
        speaker: 'B',
        textEn: 'Any areas where he might need extra support?',
        textKo: '추가로 지원이 필요한 부분이 있을까요?',
      },
      {
        id: 't5',
        speaker: 'A',
        textEn: 'His writing could use some practice — short journal entries at home would help.',
        textKo: '글쓰기 연습이 도움이 될 것 같아요 — 집에서 짧은 일기를 써보면 좋아요.',
      },
      {
        id: 't6',
        speaker: 'B',
        textEn: "I'll start that this weekend. Thank you for letting us know.",
        textKo: '이번 주말부터 시작할게요. 알려주셔서 감사합니다.',
      },
      {
        id: 't7',
        speaker: 'A',
        textEn: 'Of course. Feel free to email me anytime with updates.',
        textKo: '네, 진행 상황 언제든지 이메일로 알려주세요.',
      },
    ],
  },
);

/**
 * 오늘의 dialogue 선택: day-of-year % 개수로 회전.
 * 백엔드 구현 시 사용자 학습 진척/취약 카테고리 기반으로 교체.
 */
export function pickTodayDialogue(now: Date = new Date()) {
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return mockDialogues[dayOfYear % mockDialogues.length];
}

export const mockTodayDialogue = pickTodayDialogue();
