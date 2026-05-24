import { useState, useCallback } from 'react';
import { Audio } from 'expo-av';
import { useAudioStore } from '@/stores/audio.store';
import { USE_MOCK, apiClient } from '@/lib/api';

export function useTts() {
  const [loading, setLoading] = useState(false);
  const { playbackSpeed, setIsPlaying, cacheAudio, ttsCache } = useAudioStore();

  const playText = useCallback(
    async (text: string) => {
      if (USE_MOCK) {
        // In mock mode, just simulate playback delay
        setIsPlaying(true);
        await new Promise((resolve) => setTimeout(resolve, 1500));
        setIsPlaying(false);
        return;
      }

      const cacheKey = `${text}:${playbackSpeed}`;
      let uri = ttsCache.get(cacheKey);

      if (!uri) {
        setLoading(true);
        try {
          const res = await apiClient.post<{ audio_url: string }>('/ai/tts/generate', {
            text,
            voice: 'nova',
            speed: playbackSpeed,
          });
          uri = res.data.audio_url;
          cacheAudio(cacheKey, uri);
        } finally {
          setLoading(false);
        }
      }

      if (!uri) return;

      const { sound } = await Audio.Sound.createAsync(
        { uri },
        { shouldPlay: true, rate: playbackSpeed }
      );
      setIsPlaying(true);
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
          sound.unloadAsync();
        }
      });
    },
    [playbackSpeed, ttsCache, cacheAudio, setIsPlaying]
  );

  return { playText, loading };
}
