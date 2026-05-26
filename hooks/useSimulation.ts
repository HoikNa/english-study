import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';

export interface SimulationStartResult {
  simulationId: string;
  firstMessage: string;
}

export interface SimulationReplyResult {
  reply: string;
  coachCommentKo?: string | null;
}

export interface SimulationHistoryItem {
  who: 'ai' | 'me';
  text: string;
  time: string;
  coachNote?: {
    from: string;
    to: string;
    why: string;
  } | null;
}

export function useStartSimulation() {
  return useMutation({
    mutationFn: async (scenarioCode: string) => {
      const res = await apiClient.post<{ simulation_id: string; first_message: string }>('/ai/simulate/start', {
        scenario_code: scenarioCode,
      });
      return {
        simulationId: res.data.simulation_id,
        firstMessage: res.data.first_message,
      } satisfies SimulationStartResult;
    },
  });
}

export function useSendSimulationMessage() {
  return useMutation({
    mutationFn: async ({
      simulationId,
      message,
      history,
    }: {
      simulationId: string;
      message: string;
      history: SimulationHistoryItem[];
    }) => {
      const res = await apiClient.post<{ reply: string; coach_comment_ko?: string | null }>(`/ai/simulate/${simulationId}/message`, {
        message,
        history,
      });
      return {
        reply: res.data.reply,
        coachCommentKo: res.data.coach_comment_ko ?? null,
      } satisfies SimulationReplyResult;
    },
  });
}

