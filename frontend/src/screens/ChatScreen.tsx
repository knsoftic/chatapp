import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, KeyboardAvoidingView,
  Platform, ActivityIndicator, StatusBar, TouchableOpacity, Image, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useTheme } from '../theme';
import { Typography } from '../theme/typography';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { conversationApi, messageApi, uploadApi } from '../services/api';
import { socketService } from '../services/socket';
import ChatBubble from '../components/ChatBubble';
import MessageInput from '../components/MessageInput';
import TypingIndicator from '../components/TypingIndicator';
import { Message } from '../types';
import { formatDateSeparator, shouldShowDateSeparator, generateClientMessageId } from '../utils/formatTime';
import { formatLastSeen } from '../utils/formatTime';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';

type Props = NativeStackScreenProps<RootStackParamList, 'Chat'>;

export default function ChatScreen({ navigation, route }: Props) {
  const { conversation_id, other_user_id, other_user_name } = route.params;
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const {
    messages, setMessages, prependMessages, addMessage,
    isUserTyping, resetUnreadCount, onlineStatus,
  } = useChatStore();

  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [cursor, setCursor] = useState<string | null>(null);
  const [otherUser, setOtherUser] = useState<any>(null);

  const flatListRef = useRef<FlatList>(null);
  const conversationMessages = messages[conversation_id] || [];
  const isTyping = isUserTyping(conversation_id);
  const userOnline = onlineStatus[other_user_id];

  useEffect(() => {
    loadMessages();
    socketService.joinConversation(conversation_id);
    resetUnreadCount(conversation_id);
    messageApi.bulkRead(conversation_id).catch(() => {});
    socketService.markMessagesRead(conversation_id);

    // Fetch other user info
    fetchOtherUser();

    return () => {
      socketService.leaveConversation(conversation_id);
    };
  }, []);

  const fetchOtherUser = async () => {
    try {
      const { data } = await conversationApi.get(conversation_id);
      setOtherUser(data.data?.other_user);
    } catch {}
  };

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const response = await conversationApi.getMessages(conversation_id, null, 30);
      const { messages: msgs, has_more, next_cursor } = response.data.data;
      setMessages(conversation_id, msgs || []);
      setHasMore(has_more);
      setCursor(next_cursor);
    } catch (err) {
      console.error('Failed to load messages', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMoreMessages = async () => {
    if (isLoadingMore || !hasMore || !cursor) return;
    setIsLoadingMore(true);
    try {
      const response = await conversationApi.getMessages(conversation_id, cursor, 30);
      const { messages: msgs, has_more, next_cursor } = response.data.data;
      prependMessages(conversation_id, msgs || []);
      setHasMore(has_more);
      setCursor(next_cursor);
    } catch {}
    finally {
      setIsLoadingMore(false);
    }
  };

  const handleSendText = useCallback(async (text: string) => {
    if (!text.trim() || !user) return;
    const clientMessageId = generateClientMessageId();

    // Optimistic message
    const optimistic: Message = {
      id: clientMessageId,
      conversation_id,
      sender_id: user.id,
      receiver_id: other_user_id,
      client_message_id: clientMessageId,
      message_type: 'TEXT',
      message_text: text.trim(),
      status: 'SENDING',
      created_at: new Date().toISOString(),
    };
    addMessage(conversation_id, optimistic);
    scrollToBottom();

    try {
      await messageApi.send({
        conversation_id,
        receiver_id: other_user_id,
        client_message_id: clientMessageId,
        message_type: 'TEXT',
        message_text: text.trim(),
      });
    } catch {
      // Mark as failed in store
    }
  }, [user, conversation_id, other_user_id]);

  const handleSendDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || 'application/octet-stream',
      } as any);

      const uploadResponse = await uploadApi.document(formData);
      const { file_url, file_name, file_size, mime_type } = uploadResponse.data.data;

      const clientMessageId = generateClientMessageId();
      await messageApi.send({
        conversation_id,
        receiver_id: other_user_id,
        client_message_id: clientMessageId,
        message_type: 'DOCUMENT',
        file_url,
        file_name,
        file_size,
        mime_type,
      });
    } catch (err: any) {
      Alert.alert('Upload Failed', err?.response?.data?.message || 'Failed to send document');
    }
  }, [conversation_id, other_user_id]);

  const handleVoiceSend = useCallback(async (uri: string, duration: number) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: `voice_${Date.now()}.m4a`,
        type: 'audio/m4a',
      } as any);

      const uploadResponse = await uploadApi.voice(formData);
      const { file_url, file_name, file_size, mime_type } = uploadResponse.data.data;

      const clientMessageId = generateClientMessageId();
      const optimistic: Message = {
        id: clientMessageId,
        conversation_id,
        sender_id: user!.id,
        receiver_id: other_user_id,
        client_message_id: clientMessageId,
        message_type: 'VOICE',
        file_url,
        file_name,
        duration,
        status: 'SENDING',
        created_at: new Date().toISOString(),
      };
      addMessage(conversation_id, optimistic);

      await messageApi.send({
        conversation_id,
        receiver_id: other_user_id,
        client_message_id: clientMessageId,
        message_type: 'VOICE',
        file_url,
        file_name,
        file_size,
        mime_type,
        duration,
      });
    } catch {
      Alert.alert('Error', 'Failed to send voice message');
    }
  }, [conversation_id, other_user_id, user]);

  const scrollToBottom = () => {
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const prevMessage = conversationMessages[index - 1];
    const showDateSep = shouldShowDateSeparator(prevMessage?.created_at, item.created_at);
    const isOwn = item.sender_id === user?.id;

    return (
      <>
        {showDateSep && (
          <View style={styles.dateSeparator}>
            <View style={[styles.dateLine, { backgroundColor: theme.colors.divider }]} />
            <Text style={[styles.dateSepText, { color: theme.colors.textTertiary, backgroundColor: theme.colors.background }]}>
              {formatDateSeparator(item.created_at)}
            </Text>
            <View style={[styles.dateLine, { backgroundColor: theme.colors.divider }]} />
          </View>
        )}
        <ChatBubble
          message={item}
          isOwn={isOwn}
          theme={theme}
        />
      </>
    );
  };

  const displayName = otherUser
    ? `${otherUser.first_name} ${otherUser.last_name}`
    : other_user_name;

  const onlineLabel = userOnline?.isOnline
    ? 'Online'
    : userOnline?.lastSeen
    ? formatLastSeen(userOnline.lastSeen)
    : otherUser?.last_seen
    ? formatLastSeen(otherUser.last_seen)
    : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.headerBg, borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity id="btn-back" onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerUserInfo}
          onPress={() => navigation.navigate('UserProfile', { user_id: other_user_id })}
        >
          <View style={styles.headerAvatarContainer}>
            {otherUser?.profile_picture ? (
              <Image source={{ uri: otherUser.profile_picture }} style={styles.headerAvatar} />
            ) : (
              <View style={[styles.headerAvatarPlaceholder, { backgroundColor: theme.brand.primary + '33' }]}>
                <Text style={[styles.headerAvatarInitials, { color: theme.brand.primary }]}>
                  {displayName.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
                </Text>
              </View>
            )}
            {(userOnline?.isOnline || otherUser?.is_online) && (
              <View style={[styles.onlineDot, { backgroundColor: theme.brand.online }]} />
            )}
          </View>
          <View style={styles.headerNameContainer}>
            <Text style={[styles.headerName, { color: theme.colors.text }]} numberOfLines={1}>
              {displayName}
            </Text>
            {isTyping ? (
              <Text style={[styles.headerStatus, { color: theme.brand.primary }]}>typing...</Text>
            ) : onlineLabel ? (
              <Text style={[styles.headerStatus, { color: theme.colors.textSecondary }]}>
                {onlineLabel}
              </Text>
            ) : null}
          </View>
        </TouchableOpacity>

        <TouchableOpacity id="btn-more-options" style={styles.moreBtn}>
          <Ionicons name="ellipsis-vertical" size={22} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages */}
        {isLoading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator color={theme.brand.primary} size="large" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={conversationMessages}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            onEndReached={loadMoreMessages}
            onEndReachedThreshold={0.1}
            ListHeaderComponent={
              isLoadingMore ? (
                <ActivityIndicator color={theme.brand.primary} style={styles.loadingMore} />
              ) : null
            }
            contentContainerStyle={styles.messageList}
            onContentSizeChange={scrollToBottom}
            showsVerticalScrollIndicator={false}
            maintainVisibleContentPosition={{ minIndexForVisible: 0 }}
          />
        )}

        {/* Typing Indicator */}
        {isTyping && <TypingIndicator theme={theme} />}

        {/* Message Input */}
        <MessageInput
          theme={theme}
          conversationId={conversation_id}
          receiverId={other_user_id}
          onSendText={handleSendText}
          onSendVoice={handleVoiceSend}
          onSendDocument={handleSendDocument}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, gap: 10,
  },
  backBtn: { padding: 4 },
  headerUserInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatarContainer: { position: 'relative' },
  headerAvatar: { width: 42, height: 42, borderRadius: 21 },
  headerAvatarPlaceholder: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: 'center', justifyContent: 'center',
  },
  headerAvatarInitials: { fontWeight: '700', fontSize: 16 },
  onlineDot: {
    position: 'absolute', bottom: 0, right: 0,
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: '#fff',
  },
  headerNameContainer: { flex: 1 },
  headerName: { ...Typography.bodyMedium, fontSize: 16 },
  headerStatus: { ...Typography.caption, marginTop: 1 },
  moreBtn: { padding: 4 },
  messageList: { paddingHorizontal: 12, paddingVertical: 16, flexGrow: 1 },
  loadingCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingMore: { paddingVertical: 12 },
  dateSeparator: {
    flexDirection: 'row', alignItems: 'center', marginVertical: 16, gap: 8,
  },
  dateLine: { flex: 1, height: 1 },
  dateSepText: {
    ...Typography.small, paddingHorizontal: 8,
  },
});
