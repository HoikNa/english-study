import { useMutation } from '@tanstack/react-query';
import { USE_MOCK, apiClient } from '@/lib/api';
import type { PronunciationResult } from './useAzurePronunciation';

export interface GptFeedbackResult {
  issue: string;
  alternatives: { en: string; ko: string; context: string }[];
  importance: string;
}

const MOCK_FEEDBACK: GptFeedbackResult = {
  issue: "'clarify'의 강세가 첫 음절(CLA-)에 와야 해요. 한국어 강세 패턴이 살짝 묻어나서 원어민이 한 번 더 들으려 할 수 있어요.",
  alternatives: [
    { en: 'Let me walk you through the acceptance criteria.', ko: '더 비즈니스답고 부드러운 톤', context: '파트너 미팅 도입부' },
    { en: "Just to make sure we're aligned on the AC...", ko: '미팅 중 자연스러운 도입', context: '중간 정리 시' },
    { en: 'Can we lock down the acceptance criteria here?', ko: '결정·합의 끌어낼 때', context: '회의 마무리' },
  ],
  importance: "IT 비즈니스 미팅에서 'clarify'는 핵심 표현이에요. 발음이 자연스러워지면 상대방 신뢰도가 높아집니다.",
};

export function useGptFeedback() {
  return useMutation({
    mutationFn: async ({
      targetSentence,
      pronResult,
    }: {
      targetSentence: string;
      pronResult: PronunciationResult;
    }) => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        return MOCK_FEEDBACK;
      }

      const res = await apiClient.post<GptFeedbackResult>('/ai/feedback', {
        target_sentence: targetSentence,
        recognized_text: pronResult.recognizedText,
        pron_score: pronResult.accuracyScore,
        fluency_score: pronResult.fluencyScore,
        prosody_score: pronResult.prosodyScore,
      });
      return res.data;
    },
  });
}
