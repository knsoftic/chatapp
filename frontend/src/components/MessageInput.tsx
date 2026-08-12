import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Animated, Platform, Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Theme } from '../theme';
import VoiceRecorder from './VoiceRecorder';
import { socketService } from '../services/socket';
import { useAuthStore } from '../store/authStore';

interface Props {
  theme: Theme;
  conversationId: string;
  receiverId: string;
  onSendText: (text: string) => void;
  onSendVoice: (uri: string, duration: number) => void;
  onSendDocument: () => void;
}

export default function MessageInput({
  theme, conversationId, receiverId, onSendText, onSendVoice, onSendDocument,
}: Props) {
  const [text, setText] = useState('');
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const handleTextChange = (value: string) => {
    setText(value);

    if (!isTypingRef.current) {
      socketService.sendTypingStart(conversationId, receiverId);
      isTypingRef.current = true;
    }

    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socketService.sendTypingStop(conversationId, receiverId);
      isTypingRef.current = false;
    }, 2000);
  };

  const handleSend = async () => {
    const trimmed = text.trim();
    if (!trimmed || isSending) return;

    setText('');
    setIsSending(true);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    socketService.sendTypingStop(conversationId, receiverId);
    isTypingRef.current = false;

    try {
      await onSendText(trimmed);
    } finally {
      setIsSending(false);
    }
  };

  const handleVoiceComplete = async (uri: string, duration: number) => {
    setShowVoiceRecorder(false);
    await onSendVoice(uri, duration);
  };

  if (showVoiceRecorder) {
    return (
      <VoiceRecorder
        theme={theme}
        onComplete={handleVoiceComplete}
        onCancel={() => setShowVoiceRecorder(false)}
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border }]}>
      <TouchableOpacity
        id="btn-attach"
        onPress={onSendDocument}
        style={styles.iconBtn}
      >
        <Ionicons name="attach-outline" size={26} color={theme.colors.textSecondary} />
      </TouchableOpacity>

      <View style={[styles.inputContainer, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border }]}>
        <TextInput
          id="input-message"
          style={[styles.input, { color: theme.colors.text }]}
          placeholder="Type a message..."
          placeholderTextColor={theme.colors.placeholder}
          value={text}
          onChangeText={handleTextChange}
          multiline
          maxLength={10000}
          returnKeyType="default"
        />
      </View>

      {text.trim().length > 0 ? (
        <TouchableOpacity
          id="btn-send"
          onPress={handleSend}
          style={[styles.sendBtn, { backgroundColor: theme.brand.primary }]}
          activeOpacity={0.85}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          id="btn-voice"
          onPress={() => {
            Keyboard.dismiss();
            setShowVoiceRecorder(true);
          }}
          style={[styles.voiceBtn, { backgroundColor: theme.colors.inputBg }]}
        >
          <Ionicons name="mic-outline" size={26} color={theme.brand.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row', alignItems: 'flex-end',
    paddingHorizontal: 12, paddingVertical: 10,
    borderTopWidth: 1, gap: 10,
  },
  iconBtn: { padding: 6, paddingBottom: 4 },
  inputContainer: {
    flex: 1, borderRadius: 24, borderWidth: 1.5,
    paddingHorizontal: 16, paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    maxHeight: 120,
  },
  input: {
    fontSize: 15, lineHeight: 22, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  voiceBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
});
