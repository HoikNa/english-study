import { create } from 'zustand';

interface LearningState {
  currentExpressionId: string | null;
  currentChunkIndex: number;
  attemptCount: number;
  lastScores: Record<string, number>;
  streak: { days: number; weekFlags: boolean[] };
  setCurrentExpression: (id: string) => void;
  setChunkIndex: (index: number) => void;
  incrementAttempt: () => void;
  resetAttempt: () => void;
  setScore: (expressionId: string, score: number) => void;
}

export const useLearningStore = create<LearningState>((set) => ({
  currentExpressionId: null,
  currentChunkIndex: 0,
  attemptCount: 0,
  lastScores: {},
  streak: { days: 15, weekFlags: [true, true, true, true, true, false, false] },
  setCurrentExpression: (id) => set({ currentExpressionId: id, currentChunkIndex: 0, attemptCount: 0 }),
  setChunkIndex: (index) => set({ currentChunkIndex: index }),
  incrementAttempt: () => set((s) => ({ attemptCount: s.attemptCount + 1 })),
  resetAttempt: () => set({ attemptCount: 0 }),
  setScore: (expressionId, score) =>
    set((s) => ({ lastScores: { ...s.lastScores, [expressionId]: score } })),
}));
