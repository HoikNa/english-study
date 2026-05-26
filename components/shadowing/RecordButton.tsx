import React, { useEffect, useRef } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import {
  AudioModule,
  RecordingPresets,
  type RecordingOptions,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { C, shadow } from '@/lib/theme';
import { MOCK_RECORDING_URI } from '@/lib/recording';
import { MicIcon } from '@/components/common/Icons';
import { USE_MOCK } from '@/lib/api';

interface RecordButtonProps {
  maxSec?: number;
  minSec?: number;
  onRecordStart?: () => void;
  onRecordEnd: (uri: string) => void;
}

const SPEECH_RECORDING_OPTIONS: RecordingOptions = {
  ...RecordingPresets.HIGH_QUALITY,
  sampleRate: 16000,
  numberOfChannels: 1,
  bitRate: 64000,
  isMeteringEnabled: true,
  android: {
    ...RecordingPresets.HIGH_QUALITY.android,
    audioSource: 'voice_recognition',
    sampleRate: 16000,
  },
};

const RECORD_IDLE_COLOR = '#123B8A';
const RECORD_IDLE_BORDER = '#08265D';
const RECORD_ACTIVE_COLOR = '#B42318';
const RECORD_ACTIVE_BORDER = '#7A160F';

export function RecordButton({ maxSec = 10, minSec = 2, onRecordStart, onRecordEnd }: RecordButtonProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedAtRef = useRef<number | null>(null);
  const maxMeteringRef = useRef<number | null>(null);
  const recorder = useAudioRecorder(SPEECH_RECORDING_OPTIONS, (status) => {
    const metering = (status as { metering?: unknown }).metering;
    if (typeof metering !== 'number') return;
    maxMeteringRef.current = maxMeteringRef.current === null
      ? metering
      : Math.max(maxMeteringRef.current, metering);
  });
  const recorderState = useAudioRecorderState(recorder, 100);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const stopRecording = async () => {
    clearTimer();

    if (USE_MOCK) {
      onRecordEnd(MOCK_RECORDING_URI);
      return;
    }

    try {
      const elapsedMs = startedAtRef.current ? Date.now() - startedAtRef.current : recorderState.durationMillis;
      await recorder.stop();
      startedAtRef.current = null;

      if (elapsedMs < minSec * 1000) {
        Alert.alert('녹음이 너무 짧아요', `${minSec}초 이상 또렷하게 말한 뒤 다시 시도해 주세요.`);
        return;
      }

      if (maxMeteringRef.current !== null && maxMeteringRef.current < -55) {
        Alert.alert('목소리가 거의 녹음되지 않았어요', '마이크 권한과 휴대폰 마이크를 확인한 뒤 조금 더 크게 말해 주세요.');
        return;
      }

      const uri = recorder.uri ?? '';
      if (!uri) {
        Alert.alert('녹음 파일을 찾지 못했어요', '녹음 버튼을 다시 눌러 시도해 주세요.');
        return;
      }

      onRecordEnd(uri);
    } catch {
      startedAtRef.current = null;
      Alert.alert('녹음을 종료하지 못했어요', '잠시 후 다시 시도해 주세요.');
    }
  };

  const startRecording = async () => {
    onRecordStart?.();

    if (USE_MOCK) {
      timerRef.current = setTimeout(() => onRecordEnd(MOCK_RECORDING_URI), 700);
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
      interruptionMode: 'doNotMix',
    });

    await recorder.prepareToRecordAsync();
    startedAtRef.current = Date.now();
    maxMeteringRef.current = null;
    recorder.record();
    timerRef.current = setTimeout(stopRecording, maxSec * 1000);
  };

  useEffect(() => clearTimer, []);

  const isRecording = recorderState.isRecording;
  const durationSec = Math.max(0, Math.floor(recorderState.durationMillis / 1000));
  const buttonColor = isRecording ? RECORD_ACTIVE_COLOR : RECORD_IDLE_COLOR;
  const borderColor = isRecording ? RECORD_ACTIVE_BORDER : RECORD_IDLE_BORDER;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={isRecording ? '녹음 종료' : '녹음 시작'}
      style={({ pressed }) => [
        styles.button,
        shadow.micCta,
        { backgroundColor: buttonColor, borderColor },
        isRecording && styles.buttonActive,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
      onPress={isRecording ? stopRecording : startRecording}
    >
      <View style={styles.iconWrap}>
        <MicIcon size={22} color="#fff" />
        {isRecording && <View style={styles.pulseDot} />}
      </View>
      <View style={styles.copy}>
        <Text style={styles.primaryText}>{isRecording ? '녹음 종료' : '녹음 시작'}</Text>
        <Text style={styles.secondaryText}>
          {isRecording ? `${durationSec}s / ${maxSec}s` : `누르고 ${minSec}초 이상 말하기`}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: RECORD_IDLE_COLOR,
    borderWidth: 1.5,
    borderColor: RECORD_IDLE_BORDER,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 12,
    paddingHorizontal: 18,
  },
  buttonActive: {
    backgroundColor: RECORD_ACTIVE_COLOR,
    borderColor: RECORD_ACTIVE_BORDER,
  },
  iconWrap: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  pulseDot: {
    position: 'absolute',
    right: 2,
    top: 2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  primaryText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    fontFamily: 'InterBold',
  },
  secondaryText: {
    marginTop: 2,
    fontSize: 11,
    color: 'rgba(255,255,255,0.78)',
    fontFamily: 'IBMPlexMono',
  },
});
