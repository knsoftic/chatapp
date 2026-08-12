import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Conversation } from '../types';
import { useTheme } from '../theme';
import { formatConversationTime } from '../utils/formatTime';

interface Props {
  conversation: Conversation;
  currentUserId: string;
  onPress: () => void;
}

export default function ChatListItem({ conversation, currentUserId, onPress }: Props) {
  const { theme } = useTheme();
  const {
    other_user_first_name, other_user_last_name,
    other_user_profile_picture, other_user_is_online,
    last_message_text, last_message_type, last_message_at,
    last_message_sender_id, unread_count,
  } = conversation;

  const name = `${other_user_first_name} ${other_user_last_name}`;
  const initials = `${other_user_first_name[0]}${other_user_last_name[0]}`.toUpperCase();

  const getLastMessagePreview = () => {
    const isMine = last_message_sender_id === currentUserId;
    const prefix = isMine ? 'You: ' : '';
    if (last_message_type === 'VOICE') return `${prefix}🎤 Voice message`;
    if (last_message_type === 'DOCUMENT') return `${prefix}📄 Document`;
    if (last_message_type === 'IMAGE') return `${prefix}🖼️ Image`;
    if (last_message_text) return `${prefix}${last_message_text}`;
    return 'Start chatting...';
  };

  return (
    <TouchableOpacity
      id={`chat-item-${conversation.id}`}
      onPress={onPress}
      style={[styles.container, { backgroundColor: theme.colors.surface }]}
      activeOpacity={0.7}
    >
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        {other_user_profile_picture ? (
          <Image source={{ uri: other_user_profile_picture }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: theme.brand.primary + '22' }]}>
            <Text style={[styles.initials, { color: theme.brand.primary }]}>{initials}</Text>
          </View>
        )}
        {other_user_is_online && (
          <View style={[styles.onlineDot, { backgroundColor: theme.brand.online }]} />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: theme.colors.text }]} numberOfLines={1}>
            {name}
          </Text>
          <Text
            style={[
              styles.time,
              {
                color: unread_count > 0 ? theme.brand.primary : theme.colors.textTertiary,
              },
            ]}
          >
            {last_message_at ? formatConversationTime(last_message_at) : ''}
          </Text>
        </View>
        <View style={styles.bottomRow}>
          <Text
            style={[
              styles.preview,
              {
                color: unread_count > 0 ? theme.colors.text : theme.colors.textSecondary,
                fontWeight: unread_count > 0 ? '500' : '400',
              },
            ]}
            numberOfLines={1}
          >
            {getLastMessagePreview()}
          </Text>
          {unread_count > 0 && (
            <View style={[styles.badge, { backgroundColor: theme.brand.primary }]}>
              <Text style={styles.badgeText}>{unread_count > 99 ? '99+' : unread_count}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    alignItems: 'center',
    gap: 14,
  },
  avatarContainer: { position: 'relative' },
  avatar: { width: 54, height: 54, borderRadius: 27 },
  avatarPlaceholder: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: 'center', justifyContent: 'center',
  },
  initials: { fontSize: 20, fontWeight: '700' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2.5, borderColor: '#fff',
  },
  content: { flex: 1 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  name: { fontSize: 15, fontWeight: '600', flex: 1, marginRight: 8 },
  time: { fontSize: 12 },
  bottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  preview: { fontSize: 13, flex: 1, marginRight: 8 },
  badge: {
    minWidth: 20, height: 20, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
