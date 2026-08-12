import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { Message } from '../types';
import { Theme } from '../theme';
import { formatMessageTime } from '../utils/formatTime';
import { formatFileSize, formatDuration } from '../utils/formatTime';

interface Props {
  message: Message;
  isOwn: boolean;
  theme: Theme;
}

function StatusTick({ status, theme }: { status: string; theme: Theme }) {
  if (status === 'SENDING') return <Text style={[styles.tick, { color: theme.colors.textTertiary }]}>⏳</Text>;
  if (status === 'SENT') return <Text style={[styles.tick, { color: theme.colors.textTertiary }]}>✓</Text>;
  if (status === 'DELIVERED') return <Text style={[styles.tick, { color: theme.colors.textTertiary }]}>✓✓</Text>;
  if (status === 'READ') return <Text style={[styles.tick, { color: theme.brand.read }]}>✓✓</Text>;
  if (status === 'FAILED') return <Text style={[styles.tick, { color: theme.brand.error }]}>!</Text>;
  return null;
}

function VoiceMessage({ message, isOwn, theme }: Props) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const handlePlay = async () => {
    if (!message.file_url) return;
    if (sound) {
      await sound.unloadAsync();
      setSound(null);
      setIsPlaying(false);
      return;
    }
    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: message.file_url },
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

  return (
    <View style={styles.voiceContainer}>
      <TouchableOpacity onPress={handlePlay} style={[styles.playButton, { backgroundColor: isOwn ? '#ffffff33' : theme.brand.primary + '33' }]}>
        <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color={isOwn ? '#fff' : theme.brand.primary} />
      </TouchableOpacity>
      <View style={styles.voiceWave}>
        {Array.from({ length: 20 }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.waveBar,
              {
                height: Math.random() * 16 + 6,
                backgroundColor: isOwn ? '#ffffff88' : theme.brand.primary + '88',
              },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.voiceDuration, { color: isOwn ? '#ffffffcc' : theme.colors.textSecondary }]}>
        {formatDuration(message.duration || 0)}
      </Text>
    </View>
  );
}

function DocumentMessage({ message, isOwn, theme }: Props) {
  const handleOpen = () => {
    if (message.file_url) Linking.openURL(message.file_url);
  };

  const ext = message.file_name?.split('.').pop()?.toUpperCase() || 'FILE';

  return (
    <TouchableOpacity onPress={handleOpen} style={styles.docContainer}>
      <View style={[styles.docIconContainer, { backgroundColor: isOwn ? '#ffffff22' : theme.brand.primary + '22' }]}>
        <Text style={styles.docExt}>{ext}</Text>
      </View>
      <View style={styles.docInfo}>
        <Text
          style={[styles.docName, { color: isOwn ? '#fff' : theme.colors.text }]}
          numberOfLines={1}
        >
          {message.file_name || 'Document'}
        </Text>
        {message.file_size && (
          <Text style={[styles.docSize, { color: isOwn ? '#ffffffcc' : theme.colors.textSecondary }]}>
            {formatFileSize(message.file_size)}
          </Text>
        )}
      </View>
      <Ionicons name="download-outline" size={20} color={isOwn ? '#fff' : theme.brand.primary} />
    </TouchableOpacity>
  );
}

export default function ChatBubble({ message, isOwn, theme }: Props) {
  const bubbleColor = isOwn ? theme.brand.outgoing : theme.colors.incoming;
  const textColor = isOwn ? theme.brand.outgoingText : theme.brand.incomingText;

  return (
    <View style={[styles.row, isOwn ? styles.rowRight : styles.rowLeft]}>
      <View style={[styles.bubble, { backgroundColor: bubbleColor }, isOwn ? styles.bubbleRight : styles.bubbleLeft]}>
        {message.message_type === 'TEXT' && message.message_text && (
          <Text style={[styles.text, { color: textColor }]}>{message.message_text}</Text>
        )}
        {message.message_type === 'VOICE' && (
          <VoiceMessage message={message} isOwn={isOwn} theme={theme} />
        )}
        {message.message_type === 'DOCUMENT' && (
          <DocumentMessage message={message} isOwn={isOwn} theme={theme} />
        )}

        <View style={[styles.meta, isOwn ? styles.metaRight : styles.metaLeft]}>
          <Text style={[styles.time, { color: isOwn ? '#ffffffaa' : theme.colors.textTertiary }]}>
            {formatMessageTime(message.created_at)}
          </Text>
          {isOwn && <StatusTick status={message.status} theme={theme} />}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginVertical: 2, flexDirection: 'row' },
  rowRight: { justifyContent: 'flex-end' },
  rowLeft: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '75%', borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  bubbleRight: { borderBottomRightRadius: 4 },
  bubbleLeft: { borderBottomLeftRadius: 4 },
  text: { fontSize: 15, lineHeight: 22 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  metaRight: { justifyContent: 'flex-end' },
  metaLeft: { justifyContent: 'flex-start' },
  time: { fontSize: 11 },
  tick: { fontSize: 11 },
  voiceContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 180 },
  playButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  voiceWave: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 2, height: 28 },
  waveBar: { flex: 1, borderRadius: 2 },
  voiceDuration: { fontSize: 12, minWidth: 36 },
  docContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    minWidth: 180, maxWidth: 240,
  },
  docIconContainer: {
    width: 42, height: 42, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  docExt: { fontSize: 10, fontWeight: '700', color: '#4F46E5' },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontWeight: '600' },
  docSize: { fontSize: 12, marginTop: 2 },
});
