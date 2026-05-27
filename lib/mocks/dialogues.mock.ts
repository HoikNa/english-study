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

export const mockTodayDialogue = mockDialogues[0];
