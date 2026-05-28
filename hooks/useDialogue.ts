import { useQuery } from '@tanstack/react-query';
import { apiClient, USE_MOCK } from '@/lib/api';
import { mockDialogues, mockTodayDialogue } from '@/lib/mocks/dialogues.mock';
import type { Dialogue, DialogueTurn } from '@/types';

interface ApiDialogueTurn {
  id: string;
  speaker: 'A' | 'B';
  text_en: string;
  text_ko?: string | null;
  expression_id?: string | null;
}

interface ApiDialogue {
  id: string;
  situation_ko: string;
  situation_en?: string | null;
  category: string;
  level: number;
  speaker_a_voice: string;
  speaker_b_voice: string;
  speaker_a_name?: string | null;
  speaker_b_name?: string | null;
  turns: ApiDialogueTurn[];
}

function mapTurn(t: ApiDialogueTurn): DialogueTurn {
  return {
    id: t.id,
    speaker: t.speaker,
    textEn: t.text_en,
    textKo: t.text_ko ?? undefined,
    expressionId: t.expression_id ?? undefined,
  };
}

function mapDialogue(d: ApiDialogue): Dialogue {
  return {
    id: d.id,
    situationKo: d.situation_ko,
    situationEn: d.situation_en ?? undefined,
    category: d.category as Dialogue['category'],
    level: d.level as Dialogue['level'],
    speakerAVoice: d.speaker_a_voice,
    speakerBVoice: d.speaker_b_voice,
    speakerAName: d.speaker_a_name ?? undefined,
    speakerBName: d.speaker_b_name ?? undefined,
    turns: (d.turns ?? []).map(mapTurn),
  };
}

export function useDialogueToday() {
  return useQuery<Dialogue>({
    queryKey: ['dialogue', 'today'],
    queryFn: async () => {
      if (USE_MOCK) return mockTodayDialogue;
      const res = await apiClient.get<ApiDialogue>('/dialogues/today');
      return mapDialogue(res.data);
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useDialogue(id: string | undefined) {
  return useQuery<Dialogue>({
    queryKey: ['dialogue', id],
    queryFn: async () => {
      if (!id) throw new Error('dialogue id required');
      if (USE_MOCK) {
        const found = mockDialogues.find((d) => d.id === id);
        if (!found) throw new Error(`mock dialogue ${id} not found`);
        return found;
      }
      const res = await apiClient.get<ApiDialogue>(`/dialogues/${id}`);
      return mapDialogue(res.data);
    },
    enabled: Boolean(id),
    staleTime: 5 * 60 * 1000,
  });
}
