import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';
import { API_PREFIX, BASE_URL, USE_MOCK } from '@/lib/api';
import { MOCK_RECORDING_URI } from '@/lib/recording';
import { useAuthStore } from '@/stores/auth.store';

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

function audioNameFromUri(audioUri: string) {
  const cleanUri = audioUri.split('?')[0] ?? audioUri;
  const extension = cleanUri.match(/\.(wav|m4a|mp3|webm|ogg)$/i)?.[1]?.toLowerCase();
  return `recording.${extension ?? 'wav'}`;
}

function audioTypeFromName(name: string, fallback?: string) {
  if (fallback) return fallback;
  if (name.endsWith('.m4a')) return 'audio/mp4';
  if (name.endsWith('.mp3')) return 'audio/mpeg';
  if (name.endsWith('.webm')) return 'audio/webm';
  if (name.endsWith('.ogg')) return 'audio/ogg';
  return 'audio/wav';
}

function audioExtensionFromType(type?: string) {
  if (type === 'audio/mp4' || type === 'audio/m4a') return 'm4a';
  if (type === 'audio/mpeg') return 'mp3';
  if (type === 'audio/webm') return 'webm';
  if (type === 'audio/ogg') return 'ogg';
  return 'wav';
}

async function postPronunciation(formData: FormData) {
  const token = useAuthStore.getState().token;
  return await new Promise<PronunciationResult | ApiPronunciationResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}${API_PREFIX}/ai/pronunciation`);
    xhr.timeout = 60000;

    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    xhr.onload = () => {
      const text = xhr.responseText ?? '';
      const data = text ? JSON.parse(text) : {};

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data as PronunciationResult | ApiPronunciationResult);
        return;
      }

      const detail = typeof data === 'object' && data !== null && 'detail' in data
        ? String((data as { detail?: unknown }).detail)
        : text || xhr.statusText;
      reject(new Error(`HTTP ${xhr.status}: ${detail}`));
    };

    xhr.onerror = () => reject(new Error('Network request failed'));
    xhr.ontimeout = () => reject(new Error('Network request timed out'));
    xhr.send(formData);
  });
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

      if (!audioUri || audioUri === MOCK_RECORDING_URI) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        return MOCK_RESULT;
      }

      const formData = new FormData();
      const name = audioNameFromUri(audioUri);
      if (Platform.OS === 'web') {
        const audioFile = audioUri.startsWith('blob:') || audioUri.startsWith('data:') || audioUri.startsWith('http')
          ? await fetch(audioUri).then((res) => res.blob())
          : new Blob(['mock recording'], { type: 'audio/wav' });
        formData.append('audio_file', audioFile, `recording.${audioExtensionFromType(audioFile.type)}`);
      } else {
        formData.append('audio_file', { uri: audioUri, name, type: audioTypeFromName(name) } as any);
      }
      formData.append('reference_text', referenceText);
      if (expressionId) {
        formData.append('expression_id', expressionId);
      }

      const data = await postPronunciation(formData);
      return normalizePronunciationResult(data);
    },
  });
}
