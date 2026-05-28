import { useState, useCallback, useEffect, useRef } from 'react';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { useAudioStore } from '@/stores/audio.store';
import { USE_MOCK, apiClient } from '@/lib/api';

export function useTts() {
  const [loading, setLoading] = useState(false);
  const { playbackSpeed, isPlaying, setIsPlaying, cacheAudio, ttsCache } = useAudioStore();
  const playerRef = useRef<AudioPlayer | null>(null);
  const statusTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearPlayer = useCallback(() => {
    if (statusTimerRef.current) {
      clearInterval(statusTimerRef.current);
      statusTimerRef.current = null;
    }
    playerRef.current?.remove();
    playerRef.current = null;
    setIsPlaying(false);
  }, [setIsPlaying]);

  const playUri = useCallback(
    async (uri: string, speed: number): Promise<void> => {
      clearPlayer();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: true,
        interruptionMode: 'doNotMix',
      });
      const player = createAudioPlayer(uri);
      player.setPlaybackRate(speed);
      player.volume = 1;
      playerRef.current = player;
      setIsPlaying(true);
      player.play();

      return new Promise<void>((resolve) => {
        statusTimerRef.current = setInterval(() => {
          const currentPlayer = playerRef.current;
          if (!currentPlayer) {
            if (statusTimerRef.current) clearInterval(statusTimerRef.current);
            statusTimerRef.current = null;
            resolve();
            return;
          }
          if (!currentPlayer.playing && currentPlayer.currentTime > 0) {
            clearPlayer();
            resolve();
          }
        }, 250);
      });
    },
    [setIsPlaying, clearPlayer]
  );

  const playUrl = useCallback(
    async (audioUrl: string, speed: number = playbackSpeed) => {
      if (USE_MOCK) {
        setIsPlaying(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsPlaying(false);
        return;
      }
      await playUri(audioUrl, speed);
    },
    [playbackSpeed, setIsPlaying, playUri]
  );

  const playText = useCallback(
    async (text: string, speed = playbackSpeed, voice: string = 'nova') => {
      if (USE_MOCK) {
        setIsPlaying(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsPlaying(false);
        return;
      }

      const cacheKey = `${voice}:${text}:${speed}`;
      let uri = ttsCache.get(cacheKey);

      if (!uri) {
        setLoading(true);
        try {
          const res = await apiClient.post<{ audio_url: string }>('/ai/tts/generate', {
            text,
            voice,
            speed,
          });
          uri = res.data.audio_url;
          cacheAudio(cacheKey, uri);
        } finally {
          setLoading(false);
        }
      }

      if (!uri) return;
      await playUri(uri, speed);
    },
    [playbackSpeed, ttsCache, cacheAudio, setIsPlaying, playUri]
  );

  const stop = useCallback(() => {
    clearPlayer();
  }, [clearPlayer]);

  useEffect(() => clearPlayer, [clearPlayer]);

  return { playText, playUrl, stop, loading, isPlaying };
}
