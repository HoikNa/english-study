import React, { useEffect, useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { C, shadow } from '@/lib/theme';
import { MicIcon } from '@/components/common/Icons';
import { USE_MOCK } from '@/lib/api';

interface RecordButtonProps {
  maxSec?: number;
  onRecordStart?: () => void;
  onRecordEnd: (uri: string) => void;
}

export function RecordButton({ maxSec = 10, onRecordStart, onRecordEnd }: RecordButtonProps) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopRecording = async () => {
    clearTimer();

    if (USE_MOCK) {
      onRecordEnd('mock-recording.wav');
      return;
    }

    try {
      await recorder.stop();
      onRecordEnd(recorder.uri ?? '');
    } catch {
      Alert.alert('녹음을 종료하지 못했어요', '잠시 후 다시 시도해 주세요.');
    }
  };

  const startRecording = async () => {
    onRecordStart?.();

    if (USE_MOCK) {
      timerRef.current = setTimeout(() => onRecordEnd('mock-recording.wav'), 700);
      return;
    }

    const status = await AudioModule.requestRecordingPermissionsAsync();
    if (!status.granted) {
      Alert.alert('마이크 권한이 필요해요', '쉐도잉 발음을 분석하려면 마이크 접근을 허용해 주세요.');
      return;
    }

    await setAudioModeAsync({
      playsInSilentMode: true,
      allowsRecording: true,
    });

    await recorder.prepareToRecordAsync();
    recorder.record();
    timerRef.current = setTimeout(stopRecording, maxSec * 1000);
  };

  useEffect(() => clearTimer, []);

  const isRecording = recorderState.isRecording;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isRecording ? '녹음 종료' : '녹음 시작'}
      style={({ pressed }) => [
        styles.button,
        shadow.micCta,
        isRecording && styles.buttonActive,
        pressed && { transform: [{ scale: 0.95 }] },
      ]}
      onPress={isRecording ? stopRecording : startRecording}
    >
      <MicIcon size={28} color="#fff" />
      {isRecording && <View style={styles.pulseRing} />}
      <Text style={styles.hiddenLabel}>{isRecording ? 'Stop' : 'Record'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonActive: { backgroundColor: '#C94A2C' },
  pulseRing: {
    position: 'absolute',
    width: 80,
    height: 80,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: C.accent + '50',
  },
  hiddenLabel: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
