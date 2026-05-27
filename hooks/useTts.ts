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

  const playText = useCallback(
    async (text: string, speed = playbackSpeed, voice: string = 'nova') => {
      if (USE_MOCK) {
        // In mock mode, just simulate playback delay
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

      // 재생 완료까지 대기 (await 시 종료 시점에 resolve)
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
    [playbackSpeed, ttsCache, cacheAudio, setIsPlaying, clearPlayer]
  );

  const stop = useCallback(() => {
    clearPlayer();
  }, [clearPlayer]);

  useEffect(() => clearPlayer, [clearPlayer]);

  return { playText, stop, loading, isPlaying };
}
