import { create } from 'zustand';

type PlaybackSpeed = 0.75 | 1.0 | 1.2;

interface AudioState {
  isPlaying: boolean;
  isRecording: boolean;
  playbackSpeed: PlaybackSpeed;
  ttsCache: Map<string, string>;
  setIsPlaying: (v: boolean) => void;
  setIsRecording: (v: boolean) => void;
  setPlaybackSpeed: (speed: PlaybackSpeed) => void;
  cacheAudio: (key: string, uri: string) => void;
}

export const useAudioStore = create<AudioState>((set) => ({
  isPlaying: false,
  isRecording: false,
  playbackSpeed: 1.0,
  ttsCache: new Map(),
  setIsPlaying: (v) => set({ isPlaying: v }),
  setIsRecording: (v) => set({ isRecording: v }),
  setPlaybackSpeed: (speed) => set({ playbackSpeed: speed }),
  cacheAudio: (key, uri) =>
    set((s) => {
      const newCache = new Map(s.ttsCache);
      newCache.set(key, uri);
      return { ttsCache: newCache };
    }),
}));
