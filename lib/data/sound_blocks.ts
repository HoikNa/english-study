import type { SoundBlock } from '@/types';

/**
 * 소리블록 학습 커리큘럼 데이터.
 * 패턴 한 덩어리를 입에 붙이는 방식 (소리튠/소리블록 접근).
 * - start: 시작 블록 (be동사/I+동사/조동사/완료·존재·가정)
 * - core: 코어 블록 (기본 동사의 콜로케이션)
 * - detail: 디테일 블록 (장소/빈도/시간)
 * - advanced: 심화·확장 블록 (지각/감각/사역, 의문/관계대명사 등)
 */
export const soundBlocks: SoundBlock[] = [
  // ====================== 시작 블록 — be동사 계열 ======================
  {
    id: 'sb-start-be-1',
    category: 'start',
    subcategory: 'be-verb',
    order: 1,
    name: 'be동사 블록',
    partsLabel: 'part 1~4',
    pattern: '주어 + am/are/is + 명사·형용사·장소 — 상태/정체/위치',
    examples: [
      { en: "I'm ready.", ko: '저 준비됐어요.' },
      { en: "She's at home.", ko: '그녀는 집에 있어요.' },
      { en: "They're so kind.", ko: '그 사람들 정말 친절해요.' },
      { en: "He's a doctor.", ko: '그는 의사예요.' },
    ],
  },
  {
    id: 'sb-start-be-2',
    category: 'start',
    subcategory: 'be-verb',
    order: 2,
    name: "It's 블록",
    partsLabel: 'part 1~2',
    pattern: "It's + 형용사·명사 — 평가, 비인칭 It (시간·날씨·거리)",
    examples: [
      { en: "It's fine.", ko: '괜찮아요.' },
      { en: "It's my turn.", ko: '제 차례예요.' },
      { en: "It's raining.", ko: '비 와요.' },
      { en: "It's already 9.", ko: '벌써 9시예요.' },
    ],
  },
  {
    id: 'sb-start-be-3',
    category: 'start',
    subcategory: 'be-verb',
    order: 3,
    name: 'be ~ing 블록',
    partsLabel: 'part 1~2',
    pattern: 'am/are/is + ~ing — 지금 하고 있는 중 (현재진행)',
    examples: [
      { en: "I'm working on it.", ko: '그거 지금 하고 있어요.' },
      { en: "She's coming.", ko: '그녀 오고 있어요.' },
      { en: "We're heading there.", ko: '저희 거기로 가는 중이에요.' },
    ],
  },
  {
    id: 'sb-start-be-4',
    category: 'start',
    subcategory: 'be-verb',
    order: 4,
    name: 'be gonna 블록',
    pattern: 'be going to의 구어형 — 가까운 미래·계획',
    examples: [
      { en: "I'm gonna call him.", ko: '저 그 사람한테 전화할 거예요.' },
      { en: "It's gonna be okay.", ko: '괜찮을 거예요.' },
      { en: "We're gonna try again.", ko: '저희 다시 해볼 거예요.' },
    ],
  },
  {
    id: 'sb-start-be-5',
    category: 'start',
    subcategory: 'be-verb',
    order: 5,
    name: 'be p.p. 블록',
    pattern: 'be + 과거분사 — 수동/상태 (~되어 있다/~당했다)',
    examples: [
      { en: "I'm done.", ko: '저 다 했어요.' },
      { en: "It's broken.", ko: '망가졌어요.' },
      { en: "I'm so tired.", ko: '너무 피곤해요.' },
    ],
  },

  // ====================== 시작 블록 — I + 동사 계열 ======================
  {
    id: 'sb-start-i-1',
    category: 'start',
    subcategory: 'i-verb',
    order: 6,
    name: 'I wanna 블록',
    pattern: 'I want to의 구어형 — 바람·의지',
    examples: [
      { en: 'I wanna go home.', ko: '집에 가고 싶어요.' },
      { en: 'I wanna try that.', ko: '그거 해보고 싶어요.' },
      { en: 'I wanna ask you something.', ko: '뭐 좀 물어보고 싶어요.' },
    ],
  },
  {
    id: 'sb-start-i-2',
    category: 'start',
    subcategory: 'i-verb',
    order: 7,
    name: 'I want you to 블록',
    pattern: 'I want you to + 동사원형 — 상대에게 부탁/요청',
    examples: [
      { en: 'I want you to know this.', ko: '이거 알아두셨으면 해요.' },
      { en: 'I want you to stay.', ko: '여기 있어 줬으면 해요.' },
      { en: 'I want you to take care of it.', ko: '그거 좀 맡아 주셨으면 해요.' },
    ],
  },
  {
    id: 'sb-start-i-3',
    category: 'start',
    subcategory: 'i-verb',
    order: 8,
    name: 'I just wanted to 블록',
    pattern: 'I just wanted to + 동사 — 부드럽게 말 꺼내기',
    examples: [
      { en: 'I just wanted to say thanks.', ko: '그냥 고맙다고 말하고 싶었어요.' },
      { en: 'I just wanted to check.', ko: '한번 확인하고 싶었어요.' },
      { en: 'I just wanted to follow up.', ko: '그냥 후속 확인 차요.' },
    ],
  },
  {
    id: 'sb-start-i-4',
    category: 'start',
    subcategory: 'i-verb',
    order: 9,
    name: 'I like 블록',
    pattern: 'I like + 명사/~ing — 선호',
    examples: [
      { en: 'I like this place.', ko: '여기 좋아해요.' },
      { en: 'I like walking at night.', ko: '밤에 걷는 거 좋아해요.' },
      { en: 'I like working from home.', ko: '재택근무 좋아해요.' },
    ],
  },
  {
    id: 'sb-start-i-5',
    category: 'start',
    subcategory: 'i-verb',
    order: 10,
    name: 'I think 블록',
    pattern: 'I think (that) + 문장 — 의견/완곡한 단정',
    examples: [
      { en: "I think you're right.", ko: '네 말이 맞는 것 같아요.' },
      { en: 'I think it works.', ko: '될 것 같아요.' },
      { en: "I think we're good.", ko: '우린 괜찮은 것 같아요.' },
    ],
  },
  {
    id: 'sb-start-i-6',
    category: 'start',
    subcategory: 'i-verb',
    order: 11,
    name: 'I have 블록',
    pattern: 'I have + 명사 — 소유·보유·있음',
    examples: [
      { en: 'I have a question.', ko: '질문 있어요.' },
      { en: 'I have time today.', ko: '오늘 시간 있어요.' },
      { en: "I have an idea.", ko: '아이디어가 있어요.' },
    ],
  },
  {
    id: 'sb-start-i-7',
    category: 'start',
    subcategory: 'i-verb',
    order: 12,
    name: 'I have to 블록',
    pattern: 'I have to + 동사 — 의무/필수',
    examples: [
      { en: 'I have to go now.', ko: '저 지금 가야 돼요.' },
      { en: 'I have to finish this.', ko: '이거 끝내야 돼요.' },
      { en: 'I have to leave early.', ko: '일찍 나가야 돼요.' },
    ],
  },
  {
    id: 'sb-start-i-8',
    category: 'start',
    subcategory: 'i-verb',
    order: 13,
    name: 'I know 블록',
    pattern: 'I know (that/what/how) ~ — 앎/공감',
    examples: [
      { en: 'I know what you mean.', ko: '무슨 말인지 알아요.' },
      { en: 'I know how it feels.', ko: '그 기분 알아요.' },
      { en: 'I know it sounds strange.', ko: '이상하게 들리는 거 알아요.' },
    ],
  },
  {
    id: 'sb-start-i-9',
    category: 'start',
    subcategory: 'i-verb',
    order: 14,
    name: 'I feel 블록',
    pattern: 'I feel + 형용사 / like ~ — 감정·느낌',
    examples: [
      { en: 'I feel great.', ko: '기분 좋아요.' },
      { en: 'I feel like resting.', ko: '쉬고 싶은 기분이에요.' },
      { en: 'I feel a bit off today.', ko: '오늘 좀 컨디션이 별로예요.' },
    ],
  },

  // ====================== 시작 블록 — 조동사 계열 ======================
  {
    id: 'sb-start-modal-1',
    category: 'start',
    subcategory: 'modal',
    order: 15,
    name: 'Can I 블록',
    pattern: 'Can I + 동사? — 허락·부탁',
    examples: [
      { en: 'Can I sit here?', ko: '여기 앉아도 돼요?' },
      { en: 'Can I ask you something?', ko: '뭐 좀 물어봐도 돼요?' },
      { en: 'Can I get a refill?', ko: '리필 좀 해주실래요?' },
    ],
  },
  {
    id: 'sb-start-modal-2',
    category: 'start',
    subcategory: 'modal',
    order: 16,
    name: 'could 블록',
    pattern: '정중한 요청 / 과거 가능 / 완곡한 추측',
    examples: [
      { en: 'Could you help me?', ko: '좀 도와주실 수 있어요?' },
      { en: 'I could be wrong.', ko: '제가 틀릴 수도 있어요.' },
      { en: 'Could we move it to Friday?', ko: '금요일로 옮길 수 있을까요?' },
    ],
  },
  {
    id: 'sb-start-modal-3',
    category: 'start',
    subcategory: 'modal',
    order: 17,
    name: 'May/Might 블록',
    pattern: '약한 추측(~일지도) / 격식 허락',
    examples: [
      { en: 'It might rain.', ko: '비 올지도 몰라요.' },
      { en: 'May I come in?', ko: '들어가도 될까요?' },
      { en: 'She might be late.', ko: '그녀가 늦을 수도 있어요.' },
    ],
  },
  {
    id: 'sb-start-modal-4',
    category: 'start',
    subcategory: 'modal',
    order: 18,
    name: 'should 블록',
    pattern: '권유·의무 (~하는 게 좋겠어)',
    examples: [
      { en: 'You should rest.', ko: '좀 쉬시는 게 좋아요.' },
      { en: 'I should go.', ko: '저 가봐야겠어요.' },
      { en: 'We should talk tomorrow.', ko: '내일 얘기 좀 해요.' },
    ],
  },
  {
    id: 'sb-start-modal-5',
    category: 'start',
    subcategory: 'modal',
    order: 19,
    name: 'Would 블록',
    pattern: '정중한 요청 / 과거 습관 / 가정',
    examples: [
      { en: 'Would you mind?', ko: '혹시 괜찮으세요?' },
      { en: 'I would say so.', ko: '그렇다고 봐요.' },
      { en: 'Would you like some coffee?', ko: '커피 드릴까요?' },
    ],
  },
  {
    id: 'sb-start-modal-6',
    category: 'start',
    subcategory: 'modal',
    order: 20,
    name: 'would like to 블록',
    pattern: 'would like to — 정중한 want',
    examples: [
      { en: "I'd like to order.", ko: '주문하고 싶어요.' },
      { en: "I'd like to know more.", ko: '더 알고 싶어요.' },
      { en: "I'd like to schedule a meeting.", ko: '미팅 잡고 싶어요.' },
    ],
  },

  // ====================== 시작 블록 — 완료·존재·가정 ======================
  {
    id: 'sb-start-pc-1',
    category: 'start',
    subcategory: 'perfect-conditional',
    order: 21,
    name: "I've seen 블록",
    pattern: '현재완료 (have p.p.) — 경험·완료',
    examples: [
      { en: "I've seen it before.", ko: '전에 본 적 있어요.' },
      { en: "I've been there.", ko: '거기 가본 적 있어요.' },
      { en: "I've already finished.", ko: '벌써 끝냈어요.' },
    ],
  },
  {
    id: 'sb-start-pc-2',
    category: 'start',
    subcategory: 'perfect-conditional',
    order: 22,
    name: 'there is/are 블록',
    pattern: 'There is/are + 명사 — 존재',
    examples: [
      { en: 'There is a problem.', ko: '문제가 있어요.' },
      { en: 'There are many ways.', ko: '여러 방법이 있어요.' },
      { en: 'Is there a Wi-Fi password?', ko: '와이파이 비번 있어요?' },
    ],
  },
  {
    id: 'sb-start-pc-3',
    category: 'start',
    subcategory: 'perfect-conditional',
    order: 23,
    name: '가정법 블록',
    partsLabel: 'part 1~2',
    pattern: 'If + 주어 + 과거…, 주어 + would/could… — 가정·소망',
    examples: [
      { en: "If I were you, I'd wait.", ko: '내가 너라면 기다리겠어.' },
      { en: 'I would help if I could.', ko: '내가 할 수 있다면 도울 거예요.' },
      { en: 'It would be nice if you came.', ko: '오시면 좋겠어요.' },
    ],
  },

  // ====================== 코어 블록 ======================
  {
    id: 'sb-core-do',
    category: 'core',
    order: 1,
    name: 'do',
    pattern: '동사 do의 자주 쓰이는 콜로케이션',
    examples: [
      { en: 'I need to do the dishes.', ko: '설거지 해야 돼요.' },
      { en: 'Just do your best.', ko: '최선을 다하세요.' },
      { en: 'Could you do me a favor?', ko: '부탁 하나 해도 돼요?' },
    ],
  },
  {
    id: 'sb-core-make',
    category: 'core',
    order: 2,
    name: 'make',
    pattern: '동사 make의 자주 쓰이는 콜로케이션',
    examples: [
      { en: 'Let me make a decision.', ko: '제가 결정 좀 할게요.' },
      { en: 'That makes sense.', ko: '말 되네요.' },
      { en: 'I made a mistake.', ko: '제가 실수했어요.' },
    ],
  },
  {
    id: 'sb-core-get',
    category: 'core',
    order: 3,
    name: 'get',
    pattern: '동사 get의 자주 쓰이는 콜로케이션',
    examples: [
      { en: 'Get ready.', ko: '준비하세요.' },
      { en: 'I got home late.', ko: '집에 늦게 들어왔어요.' },
      { en: 'It got better.', ko: '나아졌어요.' },
    ],
  },
  {
    id: 'sb-core-take',
    category: 'core',
    order: 4,
    name: 'take',
    pattern: '동사 take의 자주 쓰이는 콜로케이션',
    examples: [
      { en: "Let's take a break.", ko: '잠깐 쉬어요.' },
      { en: 'Take your time.', ko: '천천히 하세요.' },
      { en: 'Take a look at this.', ko: '이거 한번 보세요.' },
    ],
  },
  {
    id: 'sb-core-go',
    category: 'core',
    order: 5,
    name: 'go',
    pattern: '동사 go의 자주 쓰이는 콜로케이션',
    examples: [
      { en: "I'm going home.", ko: '저 집에 가요.' },
      { en: "Let's go shopping.", ko: '쇼핑 가요.' },
      { en: 'Something went wrong.', ko: '뭔가 잘못됐어요.' },
    ],
  },
  {
    id: 'sb-core-have',
    category: 'core',
    order: 6,
    name: 'have',
    pattern: '동사 have의 자주 쓰이는 콜로케이션',
    examples: [
      { en: 'Have fun.', ko: '재밌게 보내세요.' },
      { en: 'Can I have a look?', ko: '한번 봐도 돼요?' },
      { en: 'I have a problem.', ko: '문제가 하나 있어요.' },
    ],
  },
  {
    id: 'sb-core-keep',
    category: 'core',
    order: 7,
    name: 'keep',
    pattern: '동사 keep의 자주 쓰이는 콜로케이션',
    examples: [
      { en: 'Keep going.', ko: '계속 하세요.' },
      { en: "Let's keep in touch.", ko: '계속 연락해요.' },
      { en: 'Keep calm.', ko: '진정하세요.' },
    ],
  },

  // ====================== 디테일 블록 ======================
  {
    id: 'sb-detail-place',
    category: 'detail',
    order: 1,
    name: '장소 블록',
    pattern: '위치·방향 표현 (문장 끝에 자주 붙음)',
    examples: [
      { en: "I'll be at home.", ko: '저 집에 있을게요.' },
      { en: "He's in the office.", ko: '그분 사무실에 있어요.' },
      { en: "It's right over there.", ko: '바로 저쪽에 있어요.' },
      { en: 'Sit next to me.', ko: '제 옆에 앉으세요.' },
    ],
  },
  {
    id: 'sb-detail-frequency',
    category: 'detail',
    order: 2,
    name: '빈도 표현 블록',
    pattern: '얼마나 자주 (every/once/from time to time)',
    examples: [
      { en: 'I work out every day.', ko: '매일 운동해요.' },
      { en: 'We meet once a week.', ko: '일주일에 한 번 만나요.' },
      { en: 'I check it from time to time.', ko: '가끔씩 확인해요.' },
    ],
  },
  {
    id: 'sb-detail-time',
    category: 'detail',
    order: 3,
    name: '시간 표현 블록',
    pattern: '언제 (this morning / in two days / right now)',
    examples: [
      { en: 'I called you this morning.', ko: '오늘 아침에 전화드렸어요.' },
      { en: "Let's do it right now.", ko: '지금 바로 해요.' },
      { en: "I'll be back in two days.", ko: '이틀 후에 돌아올게요.' },
    ],
  },

  // ====================== 심화·확장 블록 ======================
  {
    id: 'sb-adv-frequency-adv',
    category: 'advanced',
    order: 1,
    name: '빈도부사 블록',
    pattern: 'always/usually/often/sometimes/never — 위치 감각',
    examples: [
      { en: 'I always do that.', ko: '저 항상 그래요.' },
      { en: "She's never late.", ko: '그녀는 절대 늦지 않아요.' },
      { en: 'I usually skip breakfast.', ko: '저 보통 아침 안 먹어요.' },
    ],
  },
  {
    id: 'sb-adv-emotion',
    category: 'advanced',
    order: 2,
    name: '감정 표현 블록',
    pattern: '핵심 감정의 즉시 표현 (excited/worried/glad…)',
    examples: [
      { en: "I'm so excited.", ko: '저 너무 신나요.' },
      { en: "I'm worried about it.", ko: '저 그게 걱정돼요.' },
      { en: "I'm glad you're here.", ko: '여기 오셔서 다행이에요.' },
    ],
  },
  {
    id: 'sb-adv-perception',
    category: 'advanced',
    order: 3,
    name: '지각동사 블록',
    pattern: 'see/hear/watch + 목적어 + 동사원형·~ing',
    examples: [
      { en: 'I saw him leave.', ko: '그가 나가는 거 봤어요.' },
      { en: 'I heard her singing.', ko: '그녀가 노래하는 거 들었어요.' },
      { en: 'I watched the kids playing.', ko: '아이들 노는 거 봤어요.' },
    ],
  },
  {
    id: 'sb-adv-sense',
    category: 'advanced',
    order: 4,
    name: '감각동사 블록',
    pattern: 'look/sound/feel/taste/smell + 형용사',
    examples: [
      { en: 'It looks good.', ko: '좋아 보여요.' },
      { en: 'That sounds nice.', ko: '좋은 것 같아요.' },
      { en: 'This feels different.', ko: '느낌이 달라요.' },
    ],
  },
  {
    id: 'sb-adv-causative',
    category: 'advanced',
    order: 5,
    name: '사역동사 블록',
    pattern: 'make/have/let + 목적어 + 동사원형',
    examples: [
      { en: 'He made me laugh.', ko: '그가 날 웃게 했어요.' },
      { en: 'Let me check.', ko: '제가 한번 볼게요.' },
      { en: 'I had him fix it.', ko: '그한테 고치게 했어요.' },
    ],
  },
  {
    id: 'sb-adv-why',
    category: 'advanced',
    order: 6,
    name: 'Why 블록',
    pattern: '이유 묻고 답하기',
    examples: [
      { en: 'Why not?', ko: '왜 안 돼?' },
      { en: "That's why I'm here.", ko: '그래서 제가 여기 있는 거예요.' },
      { en: 'Why did you do that?', ko: '왜 그랬어요?' },
    ],
  },
  {
    id: 'sb-adv-what',
    category: 'advanced',
    order: 7,
    name: 'What 블록',
    pattern: 'what 의문문 / 관계대명사',
    examples: [
      { en: 'What do you mean?', ko: '무슨 뜻이에요?' },
      { en: "That's what I want.", ko: '그게 제가 원하는 거예요.' },
      { en: 'What time works for you?', ko: '몇 시 괜찮으세요?' },
    ],
  },
  {
    id: 'sb-adv-how',
    category: 'advanced',
    order: 8,
    name: 'How 블록',
    pattern: '방법·정도',
    examples: [
      { en: 'How was it?', ko: '어땠어요?' },
      { en: 'How do I get there?', ko: '거기 어떻게 가요?' },
      { en: 'How long will it take?', ko: '얼마나 걸려요?' },
    ],
  },
  {
    id: 'sb-adv-future-ing',
    category: 'advanced',
    order: 9,
    name: 'be -ing 가까운 미래 블록',
    pattern: '진행형으로 곧 있을 일 표현',
    examples: [
      { en: "I'm leaving soon.", ko: '저 곧 갈 거예요.' },
      { en: "We're meeting tomorrow.", ko: '내일 만나요.' },
      { en: "I'm seeing the doctor on Friday.", ko: '금요일에 의사 만나요.' },
    ],
  },
  {
    id: 'sb-adv-relative',
    category: 'advanced',
    order: 10,
    name: '관계대명사/부사 블록',
    pattern: 'who/which/that/where — 문장을 길게 이을 때',
    examples: [
      { en: 'The man who called me is here.', ko: '저한테 전화한 그분 여기 와있어요.' },
      { en: "This is the place where we met.", ko: '여기가 우리 처음 만난 곳이에요.' },
      { en: 'The plan that we discussed works.', ko: '우리가 얘기했던 계획대로 되네요.' },
    ],
  },
];

export const SOUND_BLOCK_CATEGORY_LABELS: Record<SoundBlock['category'], string> = {
  start: '시작',
  core: '코어',
  detail: '디테일',
  advanced: '심화·확장',
};

export const SOUND_BLOCK_SUBCATEGORY_LABELS: Record<NonNullable<SoundBlock['subcategory']>, string> = {
  'be-verb': 'be동사 계열',
  'i-verb': 'I + 동사 계열',
  'modal': '조동사 계열',
  'perfect-conditional': '완료·존재·가정',
};

export function getBlocksByCategory(category: SoundBlock['category']): SoundBlock[] {
  return soundBlocks.filter((b) => b.category === category).sort((a, b) => a.order - b.order);
}

export function getBlock(id: string): SoundBlock | undefined {
  return soundBlocks.find((b) => b.id === id);
}
