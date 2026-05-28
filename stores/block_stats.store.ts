import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface BlockStat {
  openCount: number;
  examplePlayCounts: Record<number, number>;
  lastOpenedAt?: string;
}

interface BlockStatsState {
  stats: Record<string, BlockStat>;
  recordOpen: (blockId: string) => void;
  recordExamplePlay: (blockId: string, exampleIdx: number) => void;
  getOpenCount: (blockId: string) => number;
  getExamplePlayCount: (blockId: string, exampleIdx: number) => number;
}

const emptyStat = (): BlockStat => ({
  openCount: 0,
  examplePlayCounts: {},
});

export const useBlockStatsStore = create<BlockStatsState>()(
  persist(
    (set, get) => ({
      stats: {},
      recordOpen: (blockId) =>
        set((state) => {
          const prev = state.stats[blockId] ?? emptyStat();
          return {
            stats: {
              ...state.stats,
              [blockId]: {
                ...prev,
                openCount: prev.openCount + 1,
                lastOpenedAt: new Date().toISOString(),
              },
            },
          };
        }),
      recordExamplePlay: (blockId, exampleIdx) =>
        set((state) => {
          const prev = state.stats[blockId] ?? emptyStat();
          return {
            stats: {
              ...state.stats,
              [blockId]: {
                ...prev,
                examplePlayCounts: {
                  ...prev.examplePlayCounts,
                  [exampleIdx]: (prev.examplePlayCounts[exampleIdx] ?? 0) + 1,
                },
              },
            },
          };
        }),
      getOpenCount: (blockId) => get().stats[blockId]?.openCount ?? 0,
      getExamplePlayCount: (blockId, idx) =>
        get().stats[blockId]?.examplePlayCounts[idx] ?? 0,
    }),
    {
      name: 'block-stats',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
