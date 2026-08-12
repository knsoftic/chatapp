import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Image, ActivityIndicator, StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useTheme } from '../theme';
import { Typography } from '../theme/typography';
import { userApi, conversationApi } from '../services/api';
import { useChatStore } from '../store/chatStore';
import { PublicUser } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { formatLastSeen } from '../utils/formatTime';

type Props = NativeStackScreenProps<RootStackParamList, 'UserProfile'>;

export default function UserProfileScreen({ navigation, route }: Props) {
  const { user_id } = route.params;
  const { theme } = useTheme();
  const { addConversation } = useChatStore();
  const [profile, setProfile] = useState<PublicUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [user_id]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      const response = await userApi.getUserById(user_id);
      setProfile(response.data.data);
    } catch {
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartChat = async () => {
    if (!profile) return;
    setIsStartingChat(true);
    try {
      const response = await conversationApi.create(profile.id);
      const conversation = response.data.data;
      addConversation({
        ...conversation,
        other_user_id: profile.id,
        other_user_first_name: profile.first_name,
        other_user_last_name: profile.last_name,
        other_user_profile_picture: profile.profile_picture,
        other_user_is_online: profile.is_online,
        unread_count: 0,
        created_at: conversation.created_at,
        updated_at: conversation.updated_at,
      });
      navigation.replace('Chat', {
        conversation_id: conversation.id,
        other_user_id: profile.id,
        other_user_name: `${profile.first_name} ${profile.last_name}`,
      });
    } catch {
    } finally {
      setIsStartingChat(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator color={theme.brand.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Profile</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.center}>
          <Text style={[styles.errorText, { color: theme.colors.textSecondary }]}>User profile not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const name = `${profile.first_name} ${profile.last_name}`;
  const initials = `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Contact Info</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Avatar Card */}
        <View style={[styles.profileHeaderCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.avatarWrapper}>
            {profile.profile_picture ? (
              <Image source={{ uri: profile.profile_picture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: theme.brand.primary }]}>
                <Text style={styles.avatarInitials}>{initials}</Text>
              </View>
            )}
            {profile.is_online && (
              <View style={[styles.onlineDot, { backgroundColor: theme.brand.online }]} />
            )}
          </View>

          <Text style={[styles.name, { color: theme.colors.text }]}>{name}</Text>
          <Text style={[styles.statusText, { color: profile.is_online ? theme.brand.primary : theme.colors.textSecondary }]}>
            {profile.is_online ? 'Online' : formatLastSeen(profile.last_seen)}
          </Text>

          <TouchableOpacity
            id="btn-message-user"
            style={[styles.chatBtn, { backgroundColor: theme.brand.primary }]}
            onPress={handleStartChat}
            disabled={isStartingChat}
            activeOpacity={0.85}
          >
            {isStartingChat ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="chatbubble-ellipses" size={20} color="#fff" />
                <Text style={styles.chatBtnText}>Message</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Bio / Details */}
        <View style={[styles.detailsCard, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.sectionHeading, { color: theme.colors.textTertiary }]}>MOBILE</Text>
          <Text style={[styles.detailValue, { color: theme.colors.text }]}>
            {profile.mobile_number_masked || profile.mobile_number}
          </Text>

          {profile.bio ? (
            <>
              <View style={[styles.divider, { backgroundColor: theme.colors.divider }]} />
              <Text style={[styles.sectionHeading, { color: theme.colors.textTertiary }]}>BIO</Text>
              <Text style={[styles.detailValue, { color: theme.colors.text }]}>{profile.bio}</Text>
            </>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerTitle: { ...Typography.h5 },
  scrollContent: { padding: 16, gap: 16 },
  profileHeaderCard: {
    borderRadius: 24, padding: 24, alignItems: 'center',
  },
  avatarWrapper: { position: 'relative', marginBottom: 16 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitials: { fontSize: 36, fontWeight: '700', color: '#fff' },
  onlineDot: {
    position: 'absolute', bottom: 4, right: 4,
    width: 18, height: 18, borderRadius: 9,
    borderWidth: 3, borderColor: '#fff',
  },
  name: { ...Typography.h4, marginBottom: 4, textAlign: 'center' },
  statusText: { ...Typography.captionMedium, marginBottom: 20 },
  chatBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 28, paddingVertical: 12, borderRadius: 20,
    shadowColor: '#4F46E5', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35, shadowRadius: 8, elevation: 5,
  },
  chatBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  detailsCard: { borderRadius: 20, padding: 20, gap: 8 },
  sectionHeading: { ...Typography.small, fontWeight: '700', letterSpacing: 1 },
  detailValue: { ...Typography.bodyMedium, fontSize: 16 },
  divider: { height: 1, marginVertical: 8 },
  errorText: { ...Typography.body },
});
