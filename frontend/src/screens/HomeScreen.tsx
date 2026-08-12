import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  FlatList, StatusBar, RefreshControl, TextInput, useWindowDimensions,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useTheme } from '../theme';
import { Typography } from '../theme/typography';
import { useChatStore } from '../store/chatStore';
import { useAuthStore } from '../store/authStore';
import { conversationApi } from '../services/api';
import ChatListItem from '../components/ChatListItem';
import { Conversation } from '../types';
import { BREAKPOINTS } from '../constants/config';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const { conversations, setConversations, isSocketConnected } = useChatStore();
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { width } = useWindowDimensions();
  const isDesktop = width >= BREAKPOINTS.tablet;

  const fetchConversations = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await conversationApi.list();
      setConversations(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConversations();
  }, []);

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const name = `${c.other_user_first_name} ${c.other_user_last_name}`.toLowerCase();
    return name.includes(searchQuery.toLowerCase());
  });

  const renderItem = ({ item }: { item: Conversation }) => (
    <ChatListItem
      conversation={item}
      currentUserId={user!.id}
      onPress={() =>
        navigation.navigate('Chat', {
          conversation_id: item.id,
          other_user_id: item.other_user_id,
          other_user_name: `${item.other_user_first_name} ${item.other_user_last_name}`,
        })
      }
    />
  );

  const EmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>💬</Text>
      <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>No conversations yet</Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
        Search for a user by mobile number to start chatting.
      </Text>
      <TouchableOpacity
        id="btn-start-chat-empty"
        style={[styles.emptyBtn, { backgroundColor: theme.brand.primary }]}
        onPress={() => navigation.navigate('SearchUser')}
      >
        <Text style={styles.emptyBtnText}>Find someone to chat</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.headerBg} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.headerBg, borderBottomColor: theme.colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Messages</Text>
          {!isSocketConnected && (
            <View style={[styles.offlineBadge, { backgroundColor: theme.brand.warning + '33' }]}>
              <Text style={[styles.offlineBadgeText, { color: theme.brand.warning }]}>Offline</Text>
            </View>
          )}
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity
            id="btn-contacts"
            onPress={() => navigation.navigate('Contacts')}
            style={styles.headerBtn}
          >
            <Ionicons name="people-outline" size={22} color={theme.colors.text} />
          </TouchableOpacity>
          <TouchableOpacity
            id="btn-settings"
            onPress={() => navigation.navigate('Settings')}
            style={styles.headerBtn}
          >
            <Ionicons name="settings-outline" size={22} color={theme.colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={[styles.searchBar, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border }]}>
        <Ionicons name="search-outline" size={18} color={theme.colors.textTertiary} />
        <TextInput
          id="input-search-conversations"
          style={[styles.searchInput, { color: theme.colors.text }]}
          placeholder="Search conversations..."
          placeholderTextColor={theme.colors.placeholder}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={18} color={theme.colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>

      {/* Conversation List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={!isLoading ? EmptyState : null}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={fetchConversations}
            tintColor={theme.brand.primary}
            colors={[theme.brand.primary]}
          />
        }
        contentContainerStyle={filteredConversations.length === 0 ? styles.emptyContainer : styles.listContent}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View style={[styles.separator, { backgroundColor: theme.colors.divider }]} />
        )}
      />

      {/* FAB — New Chat */}
      <TouchableOpacity
        id="btn-new-chat-fab"
        style={[styles.fab, { backgroundColor: theme.brand.primary }]}
        onPress={() => navigation.navigate('SearchUser')}
        activeOpacity={0.85}
      >
        <Ionicons name="create-outline" size={26} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { ...Typography.h4 },
  offlineBadge: {
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  offlineBadgeText: { fontSize: 11, fontWeight: '600' },
  headerRight: { flexDirection: 'row', gap: 12 },
  headerBtn: { padding: 4 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginHorizontal: 16, marginVertical: 12,
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, ...Typography.body },
  listContent: { paddingVertical: 4 },
  emptyContainer: { flex: 1 },
  separator: { height: 1, marginLeft: 80 },
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, paddingVertical: 60,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { ...Typography.h4, marginBottom: 10, textAlign: 'center' },
  emptySubtitle: { ...Typography.body, textAlign: 'center', lineHeight: 22, marginBottom: 28 },
  emptyBtn: {
    borderRadius: 14, paddingHorizontal: 24, paddingVertical: 12,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  fab: {
    position: 'absolute', bottom: 24, right: 20,
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 10,
  },
});
