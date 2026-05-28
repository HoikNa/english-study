import type { SoundBlock } from '@/types';

/**
 * 소리블록 학습 커리큘럼 데이터.
 * 패턴 한 덩어리를 입에 붙이는 방식.
 * - start: 시작 블록 (be동사 / I+동사 / 조동사 / 완료·존재·가정)
 * - core: 코어 블록 (기본 동사 콜로케이션)
 * - detail: 디테일 블록 (장소 / 빈도 / 시간)
 * - advanced: 심화·확장 블록 (지각·감각·사역동사, 의문사, 관계대명사 등)
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
    pattern:
      "주어 + am/are/is + 명사·형용사·장소. 'A는 B다 / A의 상태는 B다 / A는 B에 있다'를 한 번에 처리하는 가장 기본 패턴. 정체(I'm a student), 상태(I'm ready), 위치(She's at home), 평가(They're so kind) 모두 같은 구조. 회화에서는 거의 항상 줄여 발화한다(I am→I'm, She is→She's, You are→You're).",
    examples: [
      { en: "I'm ready.", ko: '저 준비됐어요.' },
      { en: "She's at home.", ko: '그녀는 집에 있어요.' },
      { en: "They're so kind.", ko: '그 사람들 정말 친절해요.' },
      { en: "He's a doctor.", ko: '그는 의사예요.' },
      { en: "We're on the same team.", ko: '우리 같은 팀이에요.' },
      { en: "I'm not sure yet.", ko: '아직 잘 모르겠어요.' },
    ],
  },
  {
    id: 'sb-start-be-2',
    category: 'start',
    subcategory: 'be-verb',
    order: 2,
    name: "It's 블록",
    partsLabel: 'part 1~2',
    pattern:
      "It's + 형용사·명사. 'It'은 (1) 앞에 언급된 것 또는 (2) 시간·날씨·거리처럼 주어가 없는 상황의 자리 채움(비인칭 It)으로 쓰인다. 평가(It's fine), 식별(It's my turn), 자연 현상(It's raining), 시간(It's already 9)까지 한국어로는 주어 없이 말할 만한 상황에 거의 자동으로 등장.",
    examples: [
      { en: "It's fine.", ko: '괜찮아요.' },
      { en: "It's my turn.", ko: '제 차례예요.' },
      { en: "It's raining.", ko: '비 와요.' },
      { en: "It's already 9.", ko: '벌써 9시예요.' },
      { en: "It's not a big deal.", ko: '별일 아니에요.' },
      { en: "It's freezing outside.", ko: '밖에 너무 추워요.' },
    ],
  },
  {
    id: 'sb-start-be-3',
    category: 'start',
    subcategory: 'be-verb',
    order: 3,
    name: 'be ~ing 블록',
    partsLabel: 'part 1~2',
    pattern:
      "am/are/is + 동사ing. 지금 이 순간 진행 중인 동작. 단순현재(I work)와의 차이는 '딱 지금 / 요즘 이 시기에' 진행 중이라는 시간적 한정. 짧게 줄여 \"I'm working on it\", \"She's coming\" 등 일상 회화의 답변에 매우 자주 쓰임. 같은 형태로 가까운 미래(I'm leaving soon)도 표현 가능 — 시간 부사가 단서.",
    examples: [
      { en: "I'm working on it.", ko: '그거 지금 하고 있어요.' },
      { en: "She's coming.", ko: '그녀 오고 있어요.' },
      { en: "We're heading there.", ko: '저희 거기로 가는 중이에요.' },
      { en: "He's looking for his keys.", ko: '그가 열쇠 찾고 있어요.' },
      { en: "They're waiting for us.", ko: '그분들이 우릴 기다리고 있어요.' },
      { en: "I'm not feeling well.", ko: '몸이 좀 안 좋아요.' },
    ],
  },
  {
    id: 'sb-start-be-4',
    category: 'start',
    subcategory: 'be-verb',
    order: 4,
    name: 'be gonna 블록',
    pattern:
      "be going to의 구어 단축형(gonna). '~할 거다 / ~하려 한다' 가까운 미래나 예측. 'will'보다 더 캐주얼하고 — 이미 정해진 계획 + 즉흥 결정 둘 다 커버. 문서·격식에선 going to 그대로, 말할 때만 gonna로 발음. 부정 'not gonna' / 의문 'Are you gonna ~?'도 매일 쓰임.",
    examples: [
      { en: "I'm gonna call him.", ko: '저 그 사람한테 전화할 거예요.' },
      { en: "It's gonna be okay.", ko: '괜찮을 거예요.' },
      { en: "We're gonna try again.", ko: '저희 다시 해볼 거예요.' },
      { en: "I'm gonna grab some coffee.", ko: '저 커피 좀 사올게요.' },
      { en: "This is gonna take a while.", ko: '이거 좀 걸릴 것 같아요.' },
      { en: "She's gonna love it.", ko: '그녀가 정말 좋아할 거예요.' },
    ],
  },
  {
    id: 'sb-start-be-5',
    category: 'start',
    subcategory: 'be-verb',
    order: 5,
    name: 'be p.p. 블록',
    pattern:
      "be + 과거분사. 수동태(누군가에게 ~당했다)와 상태(~된 상태) 두 가지 의미를 함께 커버. 회화에서는 행위자보다 '결과 상태'를 강조할 때 자주 등장: done(끝남), broken(망가짐), tired(피곤한), surprised(놀란), confused(헷갈리는). 'I was surprised' (놀랐다) vs 'I'm surprised' (놀라 있다) — 시제로 시점 구분.",
    examples: [
      { en: "I'm done.", ko: '저 다 했어요.' },
      { en: "It's broken.", ko: '망가졌어요.' },
      { en: "I'm so tired.", ko: '너무 피곤해요.' },
      { en: "I'm a bit confused.", ko: '저 좀 헷갈려요.' },
      { en: "The meeting's been moved.", ko: '회의가 옮겨졌어요.' },
      { en: "I was surprised.", ko: '깜짝 놀랐어요.' },
    ],
  },

  // ====================== 시작 블록 — I + 동사 계열 ======================
  {
    id: 'sb-start-i-1',
    category: 'start',
    subcategory: 'i-verb',
    order: 6,
    name: 'I wanna 블록',
    pattern:
      "I want to의 구어 단축형(wanna). '~하고 싶다' 직접적 욕구·의지. 캐주얼한 톤이라 격식 자리에선 'I want to' 그대로 쓰거나 'I would like to'로 바꿈. 부정 'I don't wanna'도 빈출. 회화에서 결심·제안 첫 마디로 즉시 발화 가능.",
    examples: [
      { en: 'I wanna go home.', ko: '집에 가고 싶어요.' },
      { en: 'I wanna try that.', ko: '그거 해보고 싶어요.' },
      { en: 'I wanna ask you something.', ko: '뭐 좀 물어보고 싶어요.' },
      { en: "I don't wanna be late.", ko: '늦고 싶지 않아요.' },
      { en: 'I just wanna relax.', ko: '그냥 쉬고 싶어요.' },
      { en: 'I wanna learn more about this.', ko: '이거 더 배우고 싶어요.' },
    ],
  },
  {
    id: 'sb-start-i-2',
    category: 'start',
    subcategory: 'i-verb',
    order: 7,
    name: 'I want you to 블록',
    pattern:
      "I want you to + 동사원형. 상대에게 무엇을 부탁·요청·기대. 직접적인 톤이라 친한 사이·지시 상황에 더 자연스럽고, 정중함이 필요한 자리에선 'Could you ~?' / 'I'd appreciate it if you could ~'로 바꿈. 부정 'I don't want you to ~'는 '~하지 않았으면 좋겠다'.",
    examples: [
      { en: 'I want you to know this.', ko: '이거 알아두셨으면 해요.' },
      { en: 'I want you to stay.', ko: '여기 있어 줬으면 해요.' },
      { en: 'I want you to take care of it.', ko: '그거 좀 맡아 주셨으면 해요.' },
      { en: 'I want you to be honest with me.', ko: '저한테 솔직하게 말씀해 주세요.' },
      { en: 'I want you to think about it.', ko: '한번 생각해 봐 주세요.' },
      { en: "I don't want you to worry.", ko: '걱정 안 하셨으면 해요.' },
    ],
  },
  {
    id: 'sb-start-i-3',
    category: 'start',
    subcategory: 'i-verb',
    order: 8,
    name: 'I just wanted to 블록',
    pattern:
      "I just wanted to + 동사. 'want'를 과거형(wanted)으로 + just('단지')를 붙여 부담을 덜어내는 부드러운 도입. 짧은 인사·확인·감사·후속 연락을 정중하게 시작할 때 회화와 이메일 양쪽에서 매우 빈출. 같은 의미를 강도 높여 말하면 'I wanted to ~', 더 부드럽게는 'I was just hoping to ~'.",
    examples: [
      { en: 'I just wanted to say thanks.', ko: '그냥 고맙다고 말하고 싶었어요.' },
      { en: 'I just wanted to check.', ko: '한번 확인하고 싶었어요.' },
      { en: 'I just wanted to follow up.', ko: '그냥 후속 확인 차요.' },
      { en: 'I just wanted to let you know.', ko: '그냥 알려드리려고요.' },
      { en: 'I just wanted to ask quickly.', ko: '잠깐만 여쭤보려고요.' },
      { en: 'I just wanted to make sure.', ko: '확실히 하고 싶어서요.' },
    ],
  },
  {
    id: 'sb-start-i-4',
    category: 'start',
    subcategory: 'i-verb',
    order: 9,
    name: 'I like 블록',
    pattern:
      "I like + 명사 또는 동사ing. 선호·취향. 동작이 대상이면 동명사(I like reading) 또는 to부정사(I like to read) 둘 다 가능하지만 미국 회화는 ing 쪽이 더 자연스러움. 강도 조절: love(더 강함) / really like / kind of like / don't really like / don't like at all.",
    examples: [
      { en: 'I like this place.', ko: '여기 좋아해요.' },
      { en: 'I like walking at night.', ko: '밤에 걷는 거 좋아해요.' },
      { en: 'I like working from home.', ko: '재택근무 좋아해요.' },
      { en: 'I like how you explained it.', ko: '설명해 주신 방식이 마음에 들어요.' },
      { en: 'I really like the design.', ko: '디자인 정말 마음에 들어요.' },
      { en: 'I like that idea.', ko: '그 아이디어 좋네요.' },
    ],
  },
  {
    id: 'sb-start-i-5',
    category: 'start',
    subcategory: 'i-verb',
    order: 10,
    name: 'I think 블록',
    pattern:
      "I think (that) + 문장. 의견·추측을 단정하지 않고 부드럽게 전달. 회의·이메일에서 거의 모든 의견 표명의 첫 마디. that은 거의 생략. 부정 답변을 부드럽게 만들 땐 'I don't think so' / 'I don't think that's a good idea'. 'I thought' 과거형은 회상·예측 어긋남.",
    examples: [
      { en: "I think you're right.", ko: '네 말이 맞는 것 같아요.' },
      { en: 'I think it works.', ko: '될 것 같아요.' },
      { en: "I think we're good.", ko: '우린 괜찮은 것 같아요.' },
      { en: 'I think we should wait.', ko: '기다리는 게 좋을 것 같아요.' },
      { en: "I don't think that's a problem.", ko: '그건 문제가 아닐 것 같아요.' },
      { en: "I think there's a misunderstanding.", ko: '오해가 있는 것 같아요.' },
    ],
  },
  {
    id: 'sb-start-i-6',
    category: 'start',
    subcategory: 'i-verb',
    order: 11,
    name: 'I have 블록',
    pattern:
      "I have + 명사. 소유·보유·관계(있다) 그리고 추상적 상태(시간·질문·느낌). 격식엔 'I have' 그대로, 캐주얼엔 'I've got'도 동의어. 부정은 'I don't have ~' (have not은 회화에서 거의 안 씀). 음식·음료에는 eat/drink 대신 have가 자연스러움(I have lunch).",
    examples: [
      { en: 'I have a question.', ko: '질문 있어요.' },
      { en: 'I have time today.', ko: '오늘 시간 있어요.' },
      { en: 'I have an idea.', ko: '아이디어가 있어요.' },
      { en: 'I have a meeting at 3.', ko: '3시에 미팅 있어요.' },
      { en: 'I have a good feeling about this.', ko: '이거 느낌이 좋아요.' },
      { en: "I don't have my phone with me.", ko: '폰을 안 가져왔어요.' },
    ],
  },
  {
    id: 'sb-start-i-7',
    category: 'start',
    subcategory: 'i-verb',
    order: 12,
    name: 'I have to 블록',
    pattern:
      "I have to + 동사. 외부 사정 때문에 안 할 수 없다는 의무·필요. must(격식·법규)보다 일상 회화 쪽. 주의: 부정 'I don't have to'는 '안 해도 된다'(must not의 '하면 안 된다'와 정반대). 캐주얼한 변형으로 'I gotta ~' (= I've got to)도 자주 사용.",
    examples: [
      { en: 'I have to go now.', ko: '저 지금 가야 돼요.' },
      { en: 'I have to finish this.', ko: '이거 끝내야 돼요.' },
      { en: 'I have to leave early.', ko: '일찍 나가야 돼요.' },
      { en: 'I have to take this call.', ko: '이 전화 받아야 돼요.' },
      { en: "I don't have to be there in person.", ko: '제가 직접 갈 필요는 없어요.' },
      { en: 'We have to make a decision soon.', ko: '곧 결정을 내려야 돼요.' },
    ],
  },
  {
    id: 'sb-start-i-8',
    category: 'start',
    subcategory: 'i-verb',
    order: 13,
    name: 'I know 블록',
    pattern:
      "I know (that/what/how/why) ~. 단순 인지뿐 아니라 '공감·이해'의 신호. 'I know' 단독 답변은 '맞아요, 그쵸' 뉘앙스. 부정 'I don't know'는 '답을 모름' + '결정 못 함' 둘 다. 't' 발음을 약하게 묶어 'I dunno'로 줄여 말하기도. 'You know what?'은 화제 도입('있잖아').",
    examples: [
      { en: 'I know what you mean.', ko: '무슨 말인지 알아요.' },
      { en: 'I know how it feels.', ko: '그 기분 알아요.' },
      { en: 'I know it sounds strange.', ko: '이상하게 들리는 거 알아요.' },
      { en: "I know you're busy.", ko: '바쁘신 거 알아요.' },
      { en: "I don't know how to say this.", ko: '이걸 어떻게 말해야 할지 모르겠어요.' },
      { en: 'I know that already.', ko: '그건 이미 알고 있어요.' },
    ],
  },
  {
    id: 'sb-start-i-9',
    category: 'start',
    subcategory: 'i-verb',
    order: 14,
    name: 'I feel 블록',
    pattern:
      "I feel + 형용사 또는 like + 명사/동사ing. 감정·신체 상태·직관을 모두 포괄. like 뒤에 명사면 '~하고 싶은 기분', 동사ing면 '~하는 기분'. 진행형 'I'm feeling ~'은 더 짧은 시간 한정(지금 이 순간). 'It feels like ~'는 '마치 ~ 같다' 비유.",
    examples: [
      { en: 'I feel great.', ko: '기분 좋아요.' },
      { en: 'I feel like resting.', ko: '쉬고 싶은 기분이에요.' },
      { en: 'I feel a bit off today.', ko: '오늘 좀 컨디션이 별로예요.' },
      { en: 'I feel terrible about that.', ko: '그거 정말 마음이 안 좋아요.' },
      { en: 'I feel like grabbing some coffee.', ko: '커피 한 잔 하고 싶은 기분이에요.' },
      { en: "I'm feeling much better now.", ko: '이제 훨씬 나아졌어요.' },
    ],
  },

  // ====================== 시작 블록 — 조동사 계열 ======================
  {
    id: 'sb-start-modal-1',
    category: 'start',
    subcategory: 'modal',
    order: 15,
    name: 'Can I 블록',
    pattern:
      "Can I + 동사? 가장 캐주얼한 허락·부탁. 'May I ~?'보다 일상적이고 'Could I ~?'보다 직접적. 일상 회화의 80%는 Can I로 충분. 답은 'Sure / Of course / Go ahead' 같은 긍정, 'I'm afraid not / Sorry, but ~' 정중한 거절. 'Can you ~?'는 상대에게 부탁할 때.",
    examples: [
      { en: 'Can I sit here?', ko: '여기 앉아도 돼요?' },
      { en: 'Can I ask you something?', ko: '뭐 좀 물어봐도 돼요?' },
      { en: 'Can I get a refill?', ko: '리필 좀 해주실래요?' },
      { en: 'Can I borrow your charger?', ko: '충전기 좀 빌릴 수 있을까요?' },
      { en: 'Can I help you with that?', ko: '그거 좀 도와드릴까요?' },
      { en: 'Can I have a minute?', ko: '잠깐 시간 좀 내주실래요?' },
    ],
  },
  {
    id: 'sb-start-modal-2',
    category: 'start',
    subcategory: 'modal',
    order: 16,
    name: 'could 블록',
    pattern:
      "could의 3가지 핵심 용도: (1) 정중한 요청 'Could you ~?' (Can보다 한 단계 정중), (2) 과거의 능력 'I could swim when I was 5', (3) 완곡한 추측·가능성 'It could rain'. 회화에선 (1)과 (3)이 압도적. 'I couldn't agree more'는 '완전 동감' 관용 표현.",
    examples: [
      { en: 'Could you help me?', ko: '좀 도와주실 수 있어요?' },
      { en: 'I could be wrong.', ko: '제가 틀릴 수도 있어요.' },
      { en: 'Could we move it to Friday?', ko: '금요일로 옮길 수 있을까요?' },
      { en: 'Could you say that again?', ko: '다시 한 번 말씀해 주실래요?' },
      { en: 'It could take a while.', ko: '시간이 좀 걸릴 수도 있어요.' },
      { en: "I couldn't agree more.", ko: '완전 동감이에요.' },
    ],
  },
  {
    id: 'sb-start-modal-3',
    category: 'start',
    subcategory: 'modal',
    order: 17,
    name: 'May / Might 블록',
    pattern:
      "약한 추측 '~일지도 모른다'. may와 might은 의미상 거의 같지만 might이 더 약한 가능성·캐주얼. 'may not'은 '~아닐지도', 'might have p.p.'는 '~했을지도'(과거 추측). 'May I ~?' 형태는 격식 있는 허락. 일상 회화에선 might이 may보다 4~5배 빈도 높음.",
    examples: [
      { en: 'It might rain.', ko: '비 올지도 몰라요.' },
      { en: 'May I come in?', ko: '들어가도 될까요?' },
      { en: 'She might be late.', ko: '그녀가 늦을 수도 있어요.' },
      { en: 'That might work.', ko: '그렇게 하면 될 것 같아요.' },
      { en: 'He may not remember.', ko: '그가 기억 못 할 수도 있어요.' },
      { en: 'I might have left it at home.', ko: '집에 두고 왔을지도 몰라요.' },
    ],
  },
  {
    id: 'sb-start-modal-4',
    category: 'start',
    subcategory: 'modal',
    order: 18,
    name: 'should 블록',
    pattern:
      "should + 동사. '~하는 게 좋겠다'는 권고·당위·기대. must(강한 의무)보다 약하고 친근. 'You should ~'는 조언, 'I should ~'는 다짐, 'It should ~'는 예상(~일 것이다·정상이라면 그래야 함). 부정 'shouldn't'은 '~안 하는 게 좋다'. 'should have p.p.'는 '~했어야 했는데' 후회.",
    examples: [
      { en: 'You should rest.', ko: '좀 쉬시는 게 좋아요.' },
      { en: 'I should go.', ko: '저 가봐야겠어요.' },
      { en: 'We should talk tomorrow.', ko: '내일 얘기 좀 해요.' },
      { en: "You shouldn't worry about it.", ko: '걱정 안 하셔도 돼요.' },
      { en: 'It should be ready by 5.', ko: '5시까지는 준비될 거예요.' },
      { en: 'I should have called earlier.', ko: '더 일찍 전화 드렸어야 했는데.' },
    ],
  },
  {
    id: 'sb-start-modal-5',
    category: 'start',
    subcategory: 'modal',
    order: 19,
    name: 'Would 블록',
    pattern:
      "would의 핵심 4용도: (1) 정중한 요청 'Would you ~?' (Could you보다 한 단계 더 정중), (2) 과거 습관 'He would always smile when ~', (3) 가정/조건절 결과 'I would help if I could', (4) 의향·완곡한 단정 'I would say so / That would be nice'. 회화에선 (1)과 (3)이 가장 빈출.",
    examples: [
      { en: 'Would you mind?', ko: '혹시 괜찮으세요?' },
      { en: 'I would say so.', ko: '그렇다고 봐요.' },
      { en: 'Would you like some coffee?', ko: '커피 드릴까요?' },
      { en: "I wouldn't worry about it.", ko: '저라면 그건 걱정 안 할 거예요.' },
      { en: 'That would be great.', ko: '그러면 정말 좋겠어요.' },
      { en: 'Would you do me a favor?', ko: '부탁 하나 해도 될까요?' },
    ],
  },
  {
    id: 'sb-start-modal-6',
    category: 'start',
    subcategory: 'modal',
    order: 20,
    name: 'would like to 블록',
    pattern:
      "would like to + 동사. want의 정중·완곡 버전. 식당 주문, 비즈니스 요청, 자기소개 도입에 거의 표준. 'I'd like to'로 줄여 발화. 명사를 받을 땐 'I'd like 명사'(I'd like a coffee, please). 'Would you like to ~?'는 권유·초대 ('~할래요?').",
    examples: [
      { en: "I'd like to order.", ko: '주문하고 싶어요.' },
      { en: "I'd like to know more.", ko: '더 알고 싶어요.' },
      { en: "I'd like to schedule a meeting.", ko: '미팅 잡고 싶어요.' },
      { en: "I'd like to introduce myself.", ko: '저를 좀 소개하고 싶어요.' },
      { en: 'Would you like to join us?', ko: '같이 하실래요?' },
      { en: "I'd like to share an idea.", ko: '아이디어 하나 공유하고 싶어요.' },
    ],
  },

  // ====================== 시작 블록 — 완료·존재·가정 ======================
  {
    id: 'sb-start-pc-1',
    category: 'start',
    subcategory: 'perfect-conditional',
    order: 21,
    name: "I've seen 블록",
    pattern:
      "현재완료(have/has + 과거분사). 한국어에 정확히 대응 안 됨 → 세 가지 용법으로 나눠 익힘: (1) 경험 'I've been there'(~해본 적 있다), (2) 완료/결과 'I've finished'(이미 ~한 상태), (3) 계속 'I've worked here for 5 years'(지금까지 ~해오고 있다). 주의: 'yesterday / ago' 같은 명확한 과거 시점은 같이 못 씀(그땐 단순과거).",
    examples: [
      { en: "I've seen it before.", ko: '전에 본 적 있어요.' },
      { en: "I've been there.", ko: '거기 가본 적 있어요.' },
      { en: "I've already finished.", ko: '벌써 끝냈어요.' },
      { en: "I've never tried that.", ko: '그거 한 번도 안 해봤어요.' },
      { en: 'Have you eaten yet?', ko: '밥 먹었어요?' },
      { en: "We've known each other for years.", ko: '우리 몇 년째 알고 지내요.' },
    ],
  },
  {
    id: 'sb-start-pc-2',
    category: 'start',
    subcategory: 'perfect-conditional',
    order: 22,
    name: 'there is/are 블록',
    pattern:
      "There is + 단수 / There are + 복수. '(어디에) ~이 있다'는 존재. 한국어는 그냥 '있다'지만 영어는 자리 채움 'there'을 강제. 회화에선 단수든 복수든 'There's ~' 줄임이 자주 쓰임. 의문 'Is there ~?' / 부정 'There isn't ~'. 과거는 There was / There were.",
    examples: [
      { en: 'There is a problem.', ko: '문제가 있어요.' },
      { en: 'There are many ways.', ko: '여러 방법이 있어요.' },
      { en: 'Is there a Wi-Fi password?', ko: '와이파이 비밀번호 있어요?' },
      { en: "There's no rush.", ko: '서두를 필요 없어요.' },
      { en: 'There were a lot of people.', ko: '사람이 많았어요.' },
      { en: "There's something I want to tell you.", ko: '말씀드리고 싶은 게 있어요.' },
    ],
  },
  {
    id: 'sb-start-pc-3',
    category: 'start',
    subcategory: 'perfect-conditional',
    order: 23,
    name: '가정법 블록',
    partsLabel: 'part 1~2',
    pattern:
      "If + 주어 + 과거형…, 주어 + would/could/might + 동사원형. '지금 현실과 반대인 상황'을 가정 (가정법 과거). be동사는 격식에서 모든 인칭에 were (If I were you), 회화에선 was도 허용. 'I wish + 과거형'도 같은 톤 '~라면 좋을 텐데'. 과거의 후회는 'If I had p.p., I would have p.p.' (가정법 과거완료).",
    examples: [
      { en: "If I were you, I'd wait.", ko: '내가 너라면 기다릴 거예요.' },
      { en: 'I would help if I could.', ko: '할 수만 있다면 도울 거예요.' },
      { en: 'It would be nice if you came.', ko: '오시면 좋겠어요.' },
      { en: 'If I had time, I would join.', ko: '시간만 있으면 같이 할 텐데요.' },
      { en: 'I wish I knew the answer.', ko: '답을 알면 좋겠는데.' },
      { en: 'What would you do in my place?', ko: '저라면 어떻게 하시겠어요?' },
    ],
  },

  // ====================== 코어 블록 ======================
  {
    id: 'sb-core-do',
    category: 'core',
    order: 1,
    name: 'do',
    pattern:
      "do의 본뜻은 '하다' 단 하나지만 영어는 정해진 콜로케이션을 통째 외우는 게 빠름. (1) 의무·과제 'do the dishes / do homework / do the laundry', (2) 추상적 행동 단위 'do a favor / do business / do your best', (3) 의문·부정 보조 'Do you ~?, I don't ~'. make와의 차이 — do는 보통 '주어진 과제 수행', make는 '새로 만들어냄'.",
    examples: [
      { en: 'I need to do the dishes.', ko: '설거지 해야 돼요.' },
      { en: 'Just do your best.', ko: '최선을 다하세요.' },
      { en: 'Could you do me a favor?', ko: '부탁 하나 해도 돼요?' },
      { en: "Let's do this together.", ko: '같이 해요.' },
      { en: 'I have a lot to do today.', ko: '오늘 할 일이 많아요.' },
      { en: "That'll do.", ko: '그 정도면 됐어요.' },
    ],
  },
  {
    id: 'sb-core-make',
    category: 'core',
    order: 2,
    name: 'make',
    pattern:
      "make는 '없던 것을 새로 만든다'에서 출발해 의미가 확장: (1) 물건·식사 만들기 'make dinner / make coffee', (2) 추상적 결과 만들기 'make a decision / make a mistake / make money', (3) 의미부여 'make sense', (4) 사역 'make + 사람 + 동사원형' (강제: He made me cry). do와 헷갈리는 짝은 콜로케이션으로 통째 외움.",
    examples: [
      { en: 'Let me make a decision.', ko: '제가 결정 좀 할게요.' },
      { en: 'That makes sense.', ko: '말 되네요.' },
      { en: 'I made a mistake.', ko: '제가 실수했어요.' },
      { en: "Don't make me wait.", ko: '저 기다리게 하지 마세요.' },
      { en: "I'll make it short.", ko: '짧게 말씀드릴게요.' },
      { en: 'She made me feel welcome.', ko: '그분 덕에 편안한 기분이었어요.' },
    ],
  },
  {
    id: 'sb-core-get',
    category: 'core',
    order: 3,
    name: 'get',
    pattern:
      "영어에서 가장 다재다능한 동사. (1) 얻다·받다 'get a job / get a message', (2) 도착하다 'get home / get there', (3) ~이 되다·변하다 'get tired / get better / get ready' (상태 변화), (4) 이해하다 'I get it'. have / become / arrive / receive를 한 단어로 다 처리. 회화에서 매분 등장하므로 의미마다 별도 패턴으로 입에 붙이는 게 효율적.",
    examples: [
      { en: 'Get ready.', ko: '준비하세요.' },
      { en: 'I got home late.', ko: '집에 늦게 들어왔어요.' },
      { en: 'It got better.', ko: '나아졌어요.' },
      { en: 'I get it.', ko: '이해했어요.' },
      { en: 'Can you get the door?', ko: '문 좀 열어 줄래요?' },
      { en: "I'll get back to you.", ko: '다시 연락드릴게요.' },
    ],
  },
  {
    id: 'sb-core-take',
    category: 'core',
    order: 4,
    name: 'take',
    pattern:
      "take는 '잡아서 가져가다'에서 출발해 (1) 시간·노력이 '걸리다' 'It takes 10 minutes / It takes effort', (2) 활동을 '하다' 'take a break / take a look / take a picture', (3) 책임·기회를 '맡다·잡다' 'take care of / take a chance / take responsibility'. 'It takes 시간 to 동사' 구문 매우 빈출.",
    examples: [
      { en: "Let's take a break.", ko: '잠깐 쉬어요.' },
      { en: 'Take your time.', ko: '천천히 하세요.' },
      { en: 'Take a look at this.', ko: '이거 한번 보세요.' },
      { en: 'It takes 10 minutes.', ko: '10분 걸려요.' },
      { en: "I'll take care of it.", ko: '제가 처리할게요.' },
      { en: 'Take it easy.', ko: '편하게 하세요 / 살살 해요.' },
    ],
  },
  {
    id: 'sb-core-go',
    category: 'core',
    order: 5,
    name: 'go',
    pattern:
      "단순 '가다'를 넘어 (1) 활동 가다 'go shopping / go fishing / go running' (~ing와 결합), (2) 상태 변화·악화 'go wrong / go bad / go crazy' (부정적 변화에 주로), (3) 진행·조화 'How's it going? / It's going well', (4) 격려·허락 'Go ahead / Go for it'. come과 짝으로 외움 (go는 화자에서 멀어짐, come은 화자에게 가까워짐).",
    examples: [
      { en: "I'm going home.", ko: '저 집에 가요.' },
      { en: "Let's go shopping.", ko: '쇼핑 가요.' },
      { en: 'Something went wrong.', ko: '뭔가 잘못됐어요.' },
      { en: 'Go ahead.', ko: '먼저 하세요 / 그렇게 하세요.' },
      { en: "How's it going?", ko: '잘 지내요?' },
      { en: "I'll go grab coffee.", ko: '커피 좀 사올게요.' },
    ],
  },
  {
    id: 'sb-core-have',
    category: 'core',
    order: 6,
    name: 'have',
    pattern:
      "(1) 소유·보유, (2) 경험·시간을 '갖다' 'have fun / have a hard time / have a good day', (3) 음식·음료를 '먹다·마시다' 'have lunch / have a beer' (eat/drink보다 자연스러움), (4) 사역 'have + 사람 + 동사원형' (시켜서 ~하게 하다, 중립적 톤: I had him fix it). 한국어 '있다 / 먹다 / 하다'를 한 단어로 커버.",
    examples: [
      { en: 'Have fun.', ko: '재밌게 보내세요.' },
      { en: 'Can I have a look?', ko: '한번 봐도 돼요?' },
      { en: 'I have a problem.', ko: '문제가 하나 있어요.' },
      { en: "Let's have lunch together.", ko: '같이 점심 먹어요.' },
      { en: 'Have a great day.', ko: '좋은 하루 보내세요.' },
      { en: 'I had him double-check.', ko: '그한테 한 번 더 확인하게 했어요.' },
    ],
  },
  {
    id: 'sb-core-keep',
    category: 'core',
    order: 7,
    name: 'keep',
    pattern:
      "keep의 본뜻은 '유지하다'. (1) 어떤 상태 유지 'keep calm / keep quiet / keep warm', (2) 동작이 계속 'keep + ~ing' (keep going / keep trying — 멈추지 않고 계속), (3) 약속·관계 유지 'keep in touch / keep your word'. '계속 ~하다'를 한국어처럼 매번 부사로 못 늘릴 때 keep + ing가 답.",
    examples: [
      { en: 'Keep going.', ko: '계속 하세요.' },
      { en: "Let's keep in touch.", ko: '계속 연락해요.' },
      { en: 'Keep calm.', ko: '진정하세요.' },
      { en: 'Keep me posted.', ko: '진행 상황 계속 알려주세요.' },
      { en: 'I keep forgetting.', ko: '계속 까먹어요.' },
      { en: 'Keep up the good work.', ko: '계속 잘하고 계세요.' },
    ],
  },

  // ====================== 디테일 블록 ======================
  {
    id: 'sb-detail-place',
    category: 'detail',
    order: 1,
    name: '장소 블록',
    pattern:
      "위치·방향 표현. 전치사가 핵심 — at(점·특정 지점: at home, at work, at the door), in(공간 내부: in the office, in the car), on(표면 위: on the table, on the bus), to(방향: to school, to the airport). 한국어 조사 '에 / 에서 / 로'와 1:1 매칭이 안 되니, 자주 쓰는 짝을 통째 외우는 게 빠름. 보통 문장 끝에 위치.",
    examples: [
      { en: "I'll be at home.", ko: '저 집에 있을게요.' },
      { en: "He's in the office.", ko: '그분 사무실에 있어요.' },
      { en: "It's right over there.", ko: '바로 저쪽에 있어요.' },
      { en: 'Sit next to me.', ko: '제 옆에 앉으세요.' },
      { en: 'The keys are on the table.', ko: '열쇠가 테이블 위에 있어요.' },
      { en: "I'm heading to the airport.", ko: '저 공항으로 가는 중이에요.' },
    ],
  },
  {
    id: 'sb-detail-frequency',
    category: 'detail',
    order: 2,
    name: '빈도 표현 블록',
    pattern:
      "'얼마나 자주' 표현. 두 가지 형태가 섞여 쓰임: (1) 명사구 'once a week / twice a month / every day / every other day' (보통 문장 끝), (2) 부사구 'from time to time / now and then / once in a while' (끝 또는 중간). '~에 한 번' = once a ~, '~마다' = every ~, '~걸러' = every other ~.",
    examples: [
      { en: 'I work out every day.', ko: '매일 운동해요.' },
      { en: 'We meet once a week.', ko: '일주일에 한 번 만나요.' },
      { en: 'I check it from time to time.', ko: '가끔씩 확인해요.' },
      { en: 'I see her every other day.', ko: '하루 걸러 그녀를 봐요.' },
      { en: 'It happens occasionally.', ko: '가끔 일어나요.' },
      { en: 'I rarely eat out.', ko: '저 외식 거의 안 해요.' },
    ],
  },
  {
    id: 'sb-detail-time',
    category: 'detail',
    order: 3,
    name: '시간 표현 블록',
    pattern:
      "'언제' 표현. 전치사가 시점 단위에 따라 달라짐: at + 시각(at 5), on + 요일·날짜(on Monday, on May 5), in + 월·년·계절(in May, in 2026, in spring). 기간은 for + 길이(for two days), 이래로는 since + 시점(since 2020). '~후에'는 in + 기간(in two days). 상대적: this morning / last night / right now.",
    examples: [
      { en: 'I called you this morning.', ko: '오늘 아침에 전화드렸어요.' },
      { en: "Let's do it right now.", ko: '지금 바로 해요.' },
      { en: "I'll be back in two days.", ko: '이틀 후에 돌아올게요.' },
      { en: "I've worked here since 2020.", ko: '2020년부터 여기서 일했어요.' },
      { en: 'We talked for hours.', ko: '몇 시간 동안 얘기했어요.' },
      { en: 'See you on Friday.', ko: '금요일에 봐요.' },
    ],
  },

  // ====================== 심화·확장 블록 ======================
  {
    id: 'sb-adv-frequency-adv',
    category: 'advanced',
    order: 1,
    name: '빈도부사 블록',
    pattern:
      "always / usually / often / sometimes / seldom / rarely / never. 위치 규칙: (1) be동사 뒤(She is always late), (2) 일반동사 앞(I always check), (3) 조동사와 본동사 사이(I have never tried). sometimes는 예외적으로 문장 맨앞·맨뒤도 자유. 한국어 어순으로 '항상 늦어요'를 직역해 'always late am'으로 만드는 실수 주의.",
    examples: [
      { en: 'I always do that.', ko: '저 항상 그래요.' },
      { en: "She's never late.", ko: '그녀는 절대 늦지 않아요.' },
      { en: 'I usually skip breakfast.', ko: '저 보통 아침 안 먹어요.' },
      { en: 'Sometimes I work late.', ko: '가끔 늦게까지 일해요.' },
      { en: 'I rarely watch TV.', ko: '저 TV 거의 안 봐요.' },
      { en: 'Do you often visit your parents?', ko: '부모님 자주 찾아 뵙나요?' },
    ],
  },
  {
    id: 'sb-adv-emotion',
    category: 'advanced',
    order: 2,
    name: '감정 표현 블록',
    pattern:
      "be + 감정 형용사 패턴이 핵심. -ed 형태는 '내가 그렇게 느낀다'(I'm excited), -ing 형태는 '대상이 그런 성격이다'(It's exciting). 헷갈리는 짝: bored vs boring / interested vs interesting / confused vs confusing. 대상 명시는 about(걱정·기쁨의 주제), at(놀람의 대상), with(불만의 상대). 강도는 so / really / a bit / kind of로 조절.",
    examples: [
      { en: "I'm so excited.", ko: '저 너무 신나요.' },
      { en: "I'm worried about it.", ko: '저 그게 걱정돼요.' },
      { en: "I'm glad you're here.", ko: '여기 오셔서 다행이에요.' },
      { en: "I'm a bit nervous.", ko: '좀 긴장돼요.' },
      { en: "I'm really impressed.", ko: '정말 인상 깊었어요.' },
      { en: "I'm not happy with this.", ko: '이건 마음에 안 들어요.' },
    ],
  },
  {
    id: 'sb-adv-perception',
    category: 'advanced',
    order: 3,
    name: '지각동사 블록',
    pattern:
      "see / hear / watch / notice / feel + 목적어 + 동사형. 두 가지 형태: (1) 동사원형 'I saw him leave' — 행위 전체를 처음부터 끝까지 봤다(완료), (2) 동사ing 'I saw him leaving' — 진행 중인 장면을 봤다(부분·진행). 미묘한 차이지만 정확히 가려 쓰면 원어민 감각에 가까워짐. to부정사 형태(I saw him to leave)는 틀린 표현.",
    examples: [
      { en: 'I saw him leave.', ko: '그가 나가는 거 봤어요.' },
      { en: 'I heard her singing.', ko: '그녀가 노래하는 거 들었어요.' },
      { en: 'I watched the kids playing.', ko: '아이들 노는 거 봤어요.' },
      { en: 'I noticed her smiling.', ko: '그녀가 웃는 거 알아챘어요.' },
      { en: 'Did you see that happen?', ko: '그거 일어나는 거 봤어요?' },
      { en: 'I felt the ground shake.', ko: '땅이 흔들리는 게 느껴졌어요.' },
    ],
  },
  {
    id: 'sb-adv-sense',
    category: 'advanced',
    order: 4,
    name: '감각동사 블록',
    pattern:
      "look / sound / feel / taste / smell + 형용사. 한국어로 '~해 보인다 / 들린다 / 느낌이다 / 맛이다 / 냄새다'. 핵심 주의: 부사가 아니라 '형용사'가 와야 함 (It looks well X → It looks good ○). 명사를 받을 땐 like를 붙임: 'It looks like a cat / This tastes like chicken / It sounds like a plan / It feels like home'.",
    examples: [
      { en: 'It looks good.', ko: '좋아 보여요.' },
      { en: 'That sounds nice.', ko: '좋은 것 같아요.' },
      { en: 'This feels different.', ko: '느낌이 달라요.' },
      { en: 'It tastes amazing.', ko: '맛이 정말 좋아요.' },
      { en: 'It smells like vanilla.', ko: '바닐라 향 같아요.' },
      { en: 'You look tired.', ko: '피곤해 보이세요.' },
    ],
  },
  {
    id: 'sb-adv-causative',
    category: 'advanced',
    order: 5,
    name: '사역동사 블록',
    pattern:
      "make / have / let + 목적어 + 동사원형. 세 가지 톤 구분: (1) make = 강제로 ~하게 하다(He made me cry — 시켜서가 아니라 결과적으로 그렇게 됨), (2) have = 시켜서 ~하게 하다(I had him fix it — 중립적 부탁·요청), (3) let = ~하게 두다·허락하다(Let me check — 가장 부드러움). get은 'get + 사람 + to부정사' 다른 패턴(I got him to agree).",
    examples: [
      { en: 'He made me laugh.', ko: '그가 날 웃게 했어요.' },
      { en: 'Let me check.', ko: '제가 한번 볼게요.' },
      { en: 'I had him fix it.', ko: '그한테 고치게 했어요.' },
      { en: "Don't let me down.", ko: '실망시키지 마세요.' },
      { en: 'Let it go.', ko: '그냥 넘기세요 / 잊어버려요.' },
      { en: 'I made her wait too long.', ko: '그녀를 너무 오래 기다리게 했어요.' },
    ],
  },
  {
    id: 'sb-adv-why',
    category: 'advanced',
    order: 6,
    name: 'Why 블록',
    pattern:
      "Why로 이유를 묻고 답하는 패턴. 'Why?' 단독 반문 가능. 'Why don't you ~?'는 직역하면 '왜 ~안 해?'지만 실제 의미는 '~하는 게 어때?'(권유). 답은 'Because ~' 또는 'That's why ~'(그래서 ~ 한 거다). 'Why not?'은 '왜 안 돼?(의문)' / '물론!(동의)' 양쪽으로 쓰임.",
    examples: [
      { en: 'Why not?', ko: '왜 안 돼? / 물론이죠.' },
      { en: "That's why I'm here.", ko: '그래서 제가 여기 있는 거예요.' },
      { en: 'Why did you do that?', ko: '왜 그랬어요?' },
      { en: "Why don't we try it?", ko: '한번 해보는 게 어때요?' },
      { en: "That's exactly why I called.", ko: '바로 그것 때문에 전화드린 거예요.' },
      { en: 'Why are you laughing?', ko: '왜 웃어요?' },
    ],
  },
  {
    id: 'sb-adv-what',
    category: 'advanced',
    order: 7,
    name: 'What 블록',
    pattern:
      "What의 두 큰 용법: (1) 의문문 'What do you mean?', (2) 관계대명사로 '~한 것 / ~ 것' 'That's what I want'(내가 원하는 그것). 'What if ~?'는 '~면 어떡하지?'(우려·제안), 'What about ~?'은 '~는 어때?'(제안·확인). 'What a + 명사!'는 감탄(What a day! 정말 굉장한 하루다).",
    examples: [
      { en: 'What do you mean?', ko: '무슨 뜻이에요?' },
      { en: "That's what I want.", ko: '그게 제가 원하는 거예요.' },
      { en: 'What time works for you?', ko: '몇 시 괜찮으세요?' },
      { en: 'What if it rains?', ko: '비 오면 어떡해요?' },
      { en: 'What about Friday?', ko: '금요일은 어때요?' },
      { en: 'What a day!', ko: '오늘 정말 그런 날이네요!' },
    ],
  },
  {
    id: 'sb-adv-how',
    category: 'advanced',
    order: 8,
    name: 'How 블록',
    pattern:
      "How는 방법·정도·상태를 광범위하게 묻는다: (1) 방법 'How do I get there?', (2) 정도·양 'How long / How much / How many / How often / How far', (3) 상태·소감 'How are you? / How was it?', (4) 감탄 'How nice!'. 'How come ~?'은 캐주얼 'Why ~?' — 어순 주의 (How come you didn't tell me? 안에 do 안 들어감).",
    examples: [
      { en: 'How was it?', ko: '어땠어요?' },
      { en: 'How do I get there?', ko: '거기 어떻게 가요?' },
      { en: 'How long will it take?', ko: '얼마나 걸려요?' },
      { en: 'How much is this?', ko: '이거 얼마예요?' },
      { en: "How come you didn't tell me?", ko: '왜 말 안 했어요?' },
      { en: 'How nice of you!', ko: '정말 친절하시네요!' },
    ],
  },
  {
    id: 'sb-adv-future-ing',
    category: 'advanced',
    order: 9,
    name: 'be -ing 가까운 미래 블록',
    pattern:
      "현재진행형의 미래 용법. 'will / be going to'와 비슷하지만 미묘하게 다름 — 이미 정해진 일정·약속(달력에 적힌 것)을 표현. 'will'은 즉흥 결정, 'be going to'는 계획, 'be ~ing'은 한 단계 더 확정된 일정. 시간 부사(tomorrow / next week / on Friday)와 자주 같이 쓰임. 시간 부사가 미래 신호 — 없으면 그냥 현재진행.",
    examples: [
      { en: "I'm leaving soon.", ko: '저 곧 갈 거예요.' },
      { en: "We're meeting tomorrow.", ko: '내일 만나요.' },
      { en: "I'm seeing the doctor on Friday.", ko: '금요일에 의사 만나요.' },
      { en: "They're flying in tonight.", ko: '오늘 밤에 비행기로 와요.' },
      { en: "We're moving next month.", ko: '다음 달에 이사 가요.' },
      { en: "I'm having dinner with my parents.", ko: '부모님이랑 저녁 먹어요.' },
    ],
  },
  {
    id: 'sb-adv-relative',
    category: 'advanced',
    order: 10,
    name: '관계대명사 / 부사 블록',
    pattern:
      "who / which / that / where / when. 명사 뒤에 붙어 그 명사를 설명하는 '문장 묶음'을 연결. 사람 = who / that, 사물 = which / that, 장소 = where, 시간 = when. 회화에선 that을 압도적으로 많이 쓰고, 격식·문어에선 who / which를 가려 씀. 목적격 관계대명사는 생략 가능 — 'The book (that) I'm reading is great'에서 that 빼도 자연스러움.",
    examples: [
      { en: 'The man who called me is here.', ko: '저한테 전화한 그분 여기 와있어요.' },
      { en: 'This is the place where we met.', ko: '여기가 우리 처음 만난 곳이에요.' },
      { en: 'The plan that we discussed works.', ko: '우리가 얘기했던 계획대로 되네요.' },
      { en: 'I know someone who can help.', ko: '도와줄 수 있는 사람을 알아요.' },
      { en: "The book I'm reading is great.", ko: '지금 읽고 있는 책 정말 좋아요.' },
      { en: "That's the day when everything changed.", ko: '그날 모든 게 바뀌었어요.' },
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

/** day-of-year 기반 회전. dialogue와 동일한 단순 알고리즘. */
export function pickTodayBlock(now: Date = new Date()): SoundBlock {
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return soundBlocks[dayOfYear % soundBlocks.length];
}
