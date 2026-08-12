import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';
import { formatDuration } from '../utils/formatTime';
import { MAX_VOICE_DURATION_SECONDS } from '../constants/config';

interface Props {
  theme: Theme;
  onComplete: (uri: string, duration: number) => void;
  onCancel: () => void;
}

type RecordingState = 'idle' | 'recording' | 'done';

export default function VoiceRecorder({ theme, onComplete, onCancel }: Props) {
  const [state, setState] = useState<RecordingState>('idle');
  const [duration, setDuration] = useState(0);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const durationInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.3, duration: 600, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    pulseAnim.setValue(1);
  };

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(recording);
      setState('recording');
      setDuration(0);
      startPulse();

      durationInterval.current = setInterval(() => {
        setDuration((d) => {
          if (d >= MAX_VOICE_DURATION_SECONDS) {
            stopRecording();
            return d;
          }
          return d + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording', err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    stopPulse();
    if (durationInterval.current) clearInterval(durationInterval.current);

    await recording.stopAndUnloadAsync();
    const uri = recording.getURI();
    setRecording(null);
    setRecordingUri(uri);
    setState('done');
  };

  const playPreview = async () => {
    if (!recordingUri) return;
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      return;
    }
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: recordingUri },
      { shouldPlay: true }
    );
    setSound(newSound);
    setIsPlaying(true);
    newSound.setOnPlaybackStatusUpdate((status) => {
      if (status.isLoaded && status.didJustFinish) {
        setIsPlaying(false);
        setSound(null);
      }
    });
  };

  const handleSend = () => {
    if (recordingUri) {
      onComplete(recordingUri, duration);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
      {state === 'idle' && (
        <View style={styles.idleRow}>
          <TouchableOpacity id="btn-cancel-voice" onPress={onCancel} style={styles.cancelBtn}>
            <Ionicons name="close" size={24} color={theme.colors.textSecondary} />
          </TouchableOpacity>
          <Text style={[styles.hint, { color: theme.colors.textSecondary }]}>
            Tap the mic to start recording
          </Text>
          <TouchableOpacity
            id="btn-start-recording"
            style={[styles.micBtn, { backgroundColor: theme.brand.primary }]}
            onPress={startRecording}
          >
            <Ionicons name="mic" size={28} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {state === 'recording' && (
        <View style={styles.recordingRow}>
          <TouchableOpacity id="btn-cancel-recording" onPress={onCancel}>
            <Ionicons name="trash-outline" size={24} color={theme.brand.error} />
          </TouchableOpacity>

          <View style={styles.recordingCenter}>
            <Animated.View
              style={[
                styles.recordingDot,
                { backgroundColor: theme.brand.error, transform: [{ scale: pulseAnim }] },
              ]}
            />
            <Text style={[styles.durationText, { color: theme.colors.text }]}>
              {formatDuration(duration)}
            </Text>
          </View>

          <TouchableOpacity
            id="btn-stop-recording"
            style={[styles.stopBtn, { backgroundColor: theme.brand.error }]}
            onPress={stopRecording}
          >
            <Ionicons name="stop" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {state === 'done' && (
        <View style={styles.doneRow}>
          <TouchableOpacity id="btn-discard-voice" onPress={onCancel}>
            <Ionicons name="trash-outline" size={24} color={theme.brand.error} />
          </TouchableOpacity>

          <TouchableOpacity
            id="btn-play-preview"
            style={[styles.playBtn, { backgroundColor: theme.colors.inputBg }]}
            onPress={playPreview}
          >
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color={theme.brand.primary}
            />
            <Text style={[styles.durationText, { color: theme.colors.text }]}>
              {formatDuration(duration)}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            id="btn-send-voice"
            style={[styles.sendVoiceBtn, { backgroundColor: theme.brand.primary }]}
            onPress={handleSend}
          >
            <Ionicons name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  idleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cancelBtn: { padding: 4 },
  hint: { flex: 1, textAlign: 'center', fontSize: 14 },
  micBtn: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  recordingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  recordingCenter: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recordingDot: { width: 14, height: 14, borderRadius: 7 },
  durationText: { fontSize: 18, fontWeight: '600', fontVariant: ['tabular-nums'] },
  stopBtn: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: 'center', justifyContent: 'center',
  },
  doneRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  playBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
    borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10,
  },
  sendVoiceBtn: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
});
