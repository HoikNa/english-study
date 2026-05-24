import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { USE_MOCK, apiClient } from '@/lib/api';

export interface PronunciationResult {
  totalScore: number;
  accuracyScore: number;
  fluencyScore: number;
  prosodyScore: number;
  completenessScore: number;
  words: { word: string; accuracyScore: number; errorType: 'None' | 'Omission' | 'Insertion' | 'Mispronunciation' }[];
  recognizedText: string;
}

interface ApiPronunciationResult {
  total_score?: number;
  pron_score?: number;
  accuracy_score?: number;
  fluency_score?: number;
  prosody_score?: number;
  completeness_score?: number;
  word_errors?: { word: string; accuracy_score?: number; error_type?: PronunciationResult['words'][number]['errorType'] }[];
  words?: PronunciationResult['words'];
  recognized_text?: string;
}

const MOCK_RESULT: PronunciationResult = {
  totalScore: 78,
  accuracyScore: 82,
  fluencyScore: 71,
  prosodyScore: 68,
  completenessScore: 92,
  recognizedText: "Let me clarify the acceptance criteria for this feature.",
  words: [
    { word: 'Let', accuracyScore: 95, errorType: 'None' },
    { word: 'me', accuracyScore: 90, errorType: 'None' },
    { word: 'clarify', accuracyScore: 52, errorType: 'Mispronunciation' },
    { word: 'the', accuracyScore: 88, errorType: 'None' },
    { word: 'acceptance', accuracyScore: 67, errorType: 'Mispronunciation' },
    { word: 'criteria', accuracyScore: 84, errorType: 'None' },
    { word: 'for', accuracyScore: 91, errorType: 'None' },
    { word: 'this', accuracyScore: 93, errorType: 'None' },
    { word: 'feature', accuracyScore: 89, errorType: 'None' },
  ],
};

function normalizePronunciationResult(data: PronunciationResult | ApiPronunciationResult): PronunciationResult {
  if ('totalScore' in data) return data;

  return {
    totalScore: data.total_score ?? 0,
    accuracyScore: data.pron_score ?? data.accuracy_score ?? 0,
    fluencyScore: data.fluency_score ?? 0,
    prosodyScore: data.prosody_score ?? 0,
    completenessScore: data.completeness_score ?? 0,
    recognizedText: data.recognized_text ?? '',
    words: (data.word_errors ?? data.words ?? []).map((word) => ({
      word: word.word,
      accuracyScore: 'accuracyScore' in word ? word.accuracyScore : word.accuracy_score ?? 0,
      errorType: 'errorType' in word ? word.errorType : word.error_type ?? 'None',
    })),
  };
}

export function useAzurePronunciation() {
  return useMutation({
    mutationFn: async ({
      audioUri,
      referenceText,
      expressionId,
    }: {
      audioUri: string;
      referenceText: string;
      expressionId?: string;
    }) => {
      if (USE_MOCK) {
        await new Promise((resolve) => setTimeout(resolve, 1200));
        return MOCK_RESULT;
      }

      const formData = new FormData();
      if (Platform.OS === 'web') {
        const audioFile = audioUri.startsWith('blob:') || audioUri.startsWith('data:') || audioUri.startsWith('http')
          ? await fetch(audioUri).then((res) => res.blob())
          : new Blob(['mock recording'], { type: 'audio/wav' });
        formData.append('audio_file', audioFile, 'recording.wav');
      } else {
        formData.append('audio_file', { uri: audioUri, name: 'recording.wav', type: 'audio/wav' } as any);
      }
      formData.append('reference_text', referenceText);
      if (expressionId) {
        formData.append('expression_id', expressionId);
      }

      const res = await apiClient.post<PronunciationResult | ApiPronunciationResult>('/ai/pronunciation', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return normalizePronunciationResult(res.data);
    },
  });
}
