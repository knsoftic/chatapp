import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  TextInput, ActivityIndicator, StatusBar, Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useTheme } from '../theme';
import { Typography } from '../theme/typography';
import { userApi, conversationApi } from '../services/api';
import { useChatStore } from '../store/chatStore';
import { Ionicons } from '@expo/vector-icons';
import { PublicUser } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'SearchUser'>;

export default function SearchUserScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const [query, setQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PublicUser | null | undefined>(undefined);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const { addConversation } = useChatStore();

  const handleSearch = async () => {
    if (query.trim().length < 7) return;
    setIsLoading(true);
    setResult(undefined);
    try {
      const response = await userApi.searchUser(query.trim());
      setResult(response.data.data || null);
    } catch {
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!result) return;
    setIsStartingChat(true);
    try {
      const response = await conversationApi.create(result.id);
      const conversation = response.data.data;
      addConversation({
        ...conversation,
        other_user_id: result.id,
        other_user_first_name: result.first_name,
        other_user_last_name: result.last_name,
        other_user_profile_picture: result.profile_picture,
        other_user_is_online: result.is_online,
        unread_count: 0,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
      });
      navigation.replace('Chat', {
        conversation_id: conversation.id,
        other_user_id: result.id,
        other_user_name: `${result.first_name} ${result.last_name}`,
      });
    } catch {
    } finally {
      setIsStartingChat(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity id="btn-back" onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Find User</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
          Enter the full mobile number to search
        </Text>

        {/* Search Input */}
        <View style={[styles.searchRow, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border }]}>
          <Ionicons name="search-outline" size={20} color={theme.colors.textTertiary} />
          <TextInput
            id="input-search-mobile"
            style={[styles.searchInput, { color: theme.colors.text }]}
            placeholder="+92 300 1234567"
            placeholderTextColor={theme.colors.placeholder}
            value={query}
            onChangeText={setQuery}
            keyboardType="phone-pad"
            autoFocus
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => { setQuery(''); setResult(undefined); }}>
              <Ionicons name="close-circle" size={20} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          id="btn-search"
          style={[styles.searchBtn, { backgroundColor: theme.brand.primary }, isLoading && styles.btnDisabled]}
          onPress={handleSearch}
          disabled={isLoading || query.trim().length < 7}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.searchBtnText}>Search</Text>
          )}
        </TouchableOpacity>

        {/* Results */}
        {result === null && (
          <View style={styles.emptyResult}>
            <Text style={styles.emptyEmoji}>🔍</Text>
            <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>User not found</Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
              No account is registered with this number.
            </Text>
          </View>
        )}

        {result && (
          <View style={[styles.resultCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.resultAvatarContainer}>
              {result.profile_picture ? (
                <Image source={{ uri: result.profile_picture }} style={styles.resultAvatar} />
              ) : (
                <View style={[styles.resultAvatarPlaceholder, { backgroundColor: theme.brand.primary + '33' }]}>
                  <Text style={styles.resultAvatarInitials}>
                    {result.first_name[0]}{result.last_name[0]}
                  </Text>
                </View>
              )}
              {result.is_online && (
                <View style={[styles.onlineDot, { backgroundColor: theme.brand.online }]} />
              )}
            </View>

            <View style={styles.resultInfo}>
              <Text style={[styles.resultName, { color: theme.colors.text }]}>
                {result.first_name} {result.last_name}
              </Text>
              <Text style={[styles.resultMobile, { color: theme.colors.textSecondary }]}>
                {result.mobile_number_masked || result.mobile_number}
              </Text>
              {result.bio && (
                <Text style={[styles.resultBio, { color: theme.colors.textTertiary }]} numberOfLines={2}>
                  {result.bio}
                </Text>
              )}
            </View>

            <TouchableOpacity
              id="btn-start-chat"
              style={[styles.startChatBtn, { backgroundColor: theme.brand.primary }]}
              onPress={handleStartChat}
              disabled={isStartingChat}
              activeOpacity={0.85}
            >
              {isStartingChat ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Ionicons name="chatbubble-outline" size={20} color="#fff" />
              )}
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle: { ...Typography.h5 },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 24 },
  label: { ...Typography.captionMedium, marginBottom: 12 },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
  },
  searchInput: { flex: 1, ...Typography.body },
  searchBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginBottom: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  searchBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
  emptyResult: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 52, marginBottom: 16 },
  emptyTitle: { ...Typography.h5, marginBottom: 10 },
  emptySubtitle: { ...Typography.body, textAlign: 'center' },
  resultCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1, borderRadius: 20, padding: 16,
  },
  resultAvatarContainer: { position: 'relative' },
  resultAvatar: { width: 56, height: 56, borderRadius: 28 },
  resultAvatarPlaceholder: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  resultAvatarInitials: { fontSize: 20, fontWeight: '700', color: '#4F46E5' },
  onlineDot: {
    position: 'absolute', bottom: 2, right: 2,
    width: 14, height: 14, borderRadius: 7,
    borderWidth: 2, borderColor: '#fff',
  },
  resultInfo: { flex: 1 },
  resultName: { ...Typography.bodyMedium, marginBottom: 4 },
  resultMobile: { ...Typography.caption, marginBottom: 4 },
  resultBio: { ...Typography.caption },
  startChatBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
});
