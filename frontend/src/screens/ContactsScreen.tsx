import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, FlatList, TouchableOpacity,
  ActivityIndicator, Image, Alert, Platform, StatusBar,
} from 'react-native';
import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useTheme } from '../theme';
import { Typography } from '../theme/typography';
import { userApi, conversationApi } from '../services/api';
import { User } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Contacts'>;

export default function ContactsScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [onAppUsers, setOnAppUsers] = useState<User[]>([]);
  const [notOnAppNumbers, setNotOnAppNumbers] = useState<string[]>([]);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    setLoading(true);
    try {
      const { status } = await Contacts.requestPermissionsAsync();
      if (status !== 'granted') {
        setPermissionGranted(false);
        setLoading(false);
        return;
      }
      setPermissionGranted(true);

      const { data } = await Contacts.getContactsAsync({
        fields: [Contacts.Fields.PhoneNumbers, Contacts.Fields.Name],
      });

      const phoneNumbers: string[] = [];
      data.forEach((c) => {
        if (c.phoneNumbers && c.phoneNumbers.length > 0) {
          c.phoneNumbers.forEach((p) => {
            if (p.number) phoneNumbers.push(p.number);
          });
        }
      });

      if (phoneNumbers.length === 0) {
        setLoading(false);
        return;
      }

      // Sync with backend
      const response = await userApi.syncContacts(phoneNumbers);
      const resData = response.data.data;
      setOnAppUsers(resData.on_app || []);
      setNotOnAppNumbers(resData.not_on_app || []);
    } catch (err: any) {
      Alert.alert('Contacts Error', 'Could not sync device contacts.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (user: User) => {
    try {
      const response = await conversationApi.createConversation(user.id);
      const conversation = response.data.data;
      navigation.navigate('Chat', {
        conversationId: conversation.id,
        otherUser: user,
      });
    } catch {
      Alert.alert('Error', 'Could not open chat');
    }
  };

  const handleInviteSMS = async (phoneNumber: string) => {
    const isAvailable = await SMS.isAvailableAsync();
    const inviteMessage = `Join me on ChatApp! Download the app here: http://172.20.10.2:8081`;
    if (isAvailable) {
      await SMS.sendSMSAsync([phoneNumber], inviteMessage);
    } else {
      Alert.alert('SMS Invite', `Share this link with ${phoneNumber}:\n\n${inviteMessage}`);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity id="btn-back" onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={[styles.backText, { color: theme.colors.text }]}>←</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text }]}>Contacts Sync</Text>
        <TouchableOpacity onPress={loadContacts} style={styles.refreshBtn}>
          <Text style={{ fontSize: 18 }}>🔄</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.brand.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.textSecondary }]}>
            Syncing contacts with ChatApp...
          </Text>
        </View>
      ) : !permissionGranted ? (
        <View style={styles.center}>
          <Text style={{ fontSize: 48, marginBottom: 12 }}>📱</Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>Contacts Permission Required</Text>
          <Text style={[styles.emptyDesc, { color: theme.colors.textSecondary }]}>
            Grant permission to see which of your contacts are already using ChatApp!
          </Text>
          <TouchableOpacity onPress={loadContacts} style={styles.grantBtn}>
            <Text style={styles.grantBtnText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={[
            { type: 'header_on_app' },
            ...onAppUsers.map((u) => ({ type: 'user', data: u })),
            { type: 'header_invite' },
            ...notOnAppNumbers.slice(0, 30).map((n) => ({ type: 'invite', data: n })),
          ]}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => {
            if (item.type === 'header_on_app') {
              return (
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    🟢 Contacts on ChatApp ({onAppUsers.length})
                  </Text>
                </View>
              );
            }
            if (item.type === 'header_invite') {
              return (
                <View style={[styles.sectionHeader, { marginTop: 24 }]}>
                  <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                    📩 Invite Friends to ChatApp ({notOnAppNumbers.length})
                  </Text>
                </View>
              );
            }
            if (item.type === 'user') {
              const u = item.data as User;
              return (
                <View style={[styles.userRow, { borderBottomColor: theme.colors.divider }]}>
                  <Image
                    source={{ uri: u.profile_picture || 'https://via.placeholder.com/150' }}
                    style={styles.avatar}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.userName, { color: theme.colors.text }]}>
                      {u.first_name} {u.last_name}
                    </Text>
                    {u.bio ? (
                      <Text style={[styles.userBio, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                        {u.bio}
                      </Text>
                    ) : null}
                  </View>
                  <TouchableOpacity onPress={() => handleStartChat(u)} style={styles.chatBtn}>
                    <Text style={styles.chatBtnText}>Chat</Text>
                  </TouchableOpacity>
                </View>
              );
            }
            if (item.type === 'invite') {
              const num = item.data as string;
              return (
                <View style={[styles.userRow, { borderBottomColor: theme.colors.divider }]}>
                  <View style={styles.inviteAvatar}>
                    <Text style={{ fontSize: 20 }}>👤</Text>
                  </View>
                  <Text style={[styles.phoneText, { color: theme.colors.text, flex: 1 }]}>
                    {num}
                  </Text>
                  <TouchableOpacity onPress={() => handleInviteSMS(num)} style={styles.inviteBtn}>
                    <Text style={styles.inviteBtnText}>Invite</Text>
                  </TouchableOpacity>
                </View>
              );
            }
            return null;
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  backBtn: { padding: 8 },
  backText: { fontSize: 22 },
  title: { ...Typography.h3, fontSize: 18 },
  refreshBtn: { padding: 8 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  loadingText: { ...Typography.body, marginTop: 12 },
  emptyTitle: { ...Typography.h3, textAlign: 'center', marginBottom: 8 },
  emptyDesc: { ...Typography.body, textAlign: 'center', marginBottom: 20 },
  grantBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  grantBtnText: { color: '#fff', fontWeight: '700' },
  sectionHeader: { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(255,255,255,0.03)' },
  sectionTitle: { ...Typography.h4, fontSize: 15 },
  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1,
  },
  avatar: { width: 46, height: 46, borderRadius: 23 },
  inviteAvatar: {
    width: 46, height: 46, borderRadius: 23, backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  userName: { ...Typography.bodyMedium, fontWeight: '700' },
  userBio: { ...Typography.caption, marginTop: 2 },
  phoneText: { ...Typography.bodyMedium },
  chatBtn: { backgroundColor: '#4F46E5', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10 },
  chatBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  inviteBtn: { borderWidth: 1.5, borderColor: '#7C3AED', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 10 },
  inviteBtnText: { color: '#A78BFA', fontWeight: '700', fontSize: 13 },
});
