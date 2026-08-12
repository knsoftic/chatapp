import React from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView,
  TouchableOpacity, Switch, Alert, Image, StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useTheme } from '../theme';
import { Typography } from '../theme/typography';
import { useAuthStore } from '../store/authStore';
import { socketService } from '../services/socket';
import { notificationService } from '../services/notifications';
import { authApi } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export default function SettingsScreen({ navigation }: Props) {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await notificationService.unregisterDevice();
          await authApi.logout().catch(() => {});
          socketService.disconnect();
          await logout();
        },
      },
    ]);
  };

  const SettingItem = ({
    icon, label, onPress, right, id,
  }: {
    icon: string; label: string; onPress?: () => void; right?: React.ReactNode; id: string;
  }) => (
    <TouchableOpacity
      id={id}
      style={[styles.settingItem, { borderBottomColor: theme.colors.divider }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.settingIconBox, { backgroundColor: theme.brand.primary + '22' }]}>
          <Ionicons name={icon as any} size={20} color={theme.brand.primary} />
        </View>
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>{label}</Text>
      </View>
      <View style={styles.settingRight}>
        {right || <Ionicons name="chevron-forward" size={18} color={theme.colors.textTertiary} />}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity id="btn-back" onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <TouchableOpacity
          id="btn-profile"
          style={[styles.profileCard, { backgroundColor: theme.colors.card }]}
          onPress={() => navigation.navigate('AccountSettings')}
          activeOpacity={0.8}
        >
          <View style={styles.profileAvatarContainer}>
            {user?.profile_picture ? (
              <Image source={{ uri: user.profile_picture }} style={styles.profileAvatar} />
            ) : (
              <View style={[styles.profileAvatarPlaceholder, { backgroundColor: theme.brand.primary }]}>
                <Text style={styles.profileAvatarInitials}>
                  {user?.first_name?.[0]}{user?.last_name?.[0]}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.profileName, { color: theme.colors.text }]}>
              {user?.first_name} {user?.last_name}
            </Text>
            <Text style={[styles.profileNumber, { color: theme.colors.textSecondary }]}>
              {user?.mobile_number}
            </Text>
            {user?.bio && (
              <Text style={[styles.profileBio, { color: theme.colors.textTertiary }]} numberOfLines={1}>
                {user.bio}
              </Text>
            )}
          </View>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.textTertiary} />
        </TouchableOpacity>

        {/* Section: Appearance */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>APPEARANCE</Text>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <SettingItem
            id="setting-theme"
            icon="moon-outline"
            label="Dark Mode"
            right={
              <Switch
                value={theme.mode === 'dark'}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.colors.border, true: theme.brand.primary + '88' }}
                thumbColor={theme.mode === 'dark' ? theme.brand.primary : '#f4f3f4'}
              />
            }
          />
        </View>

        {/* Section: Privacy & Notifications */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>PRIVACY & NOTIFICATIONS</Text>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <SettingItem
            id="setting-notifications"
            icon="notifications-outline"
            label="Notification Settings"
            onPress={() => navigation.navigate('NotificationSettings')}
          />
          <SettingItem
            id="setting-account"
            icon="person-outline"
            label="Account Settings"
            onPress={() => navigation.navigate('AccountSettings')}
          />
        </View>

        {/* Section: Account */}
        <Text style={[styles.sectionTitle, { color: theme.colors.textSecondary }]}>ACCOUNT</Text>
        <View style={[styles.section, { backgroundColor: theme.colors.card }]}>
          <SettingItem
            id="setting-logout"
            icon="log-out-outline"
            label="Logout"
            onPress={handleLogout}
          />
        </View>

        <Text style={[styles.version, { color: theme.colors.textTertiary }]}>
          ChatApp v1.0.0
        </Text>
      </ScrollView>
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
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    margin: 16, borderRadius: 20, padding: 16,
  },
  profileAvatarContainer: {},
  profileAvatar: { width: 64, height: 64, borderRadius: 32 },
  profileAvatarPlaceholder: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center',
  },
  profileAvatarInitials: { fontSize: 24, fontWeight: '700', color: '#fff' },
  profileInfo: { flex: 1 },
  profileName: { ...Typography.bodyMedium, fontSize: 17, marginBottom: 4 },
  profileNumber: { ...Typography.caption, marginBottom: 3 },
  profileBio: { ...Typography.caption },
  sectionTitle: {
    ...Typography.small, fontWeight: '700', letterSpacing: 1.2,
    paddingHorizontal: 20, paddingTop: 20, paddingBottom: 8,
  },
  section: { marginHorizontal: 16, borderRadius: 16, overflow: 'hidden' },
  settingItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingIconBox: {
    width: 36, height: 36, borderRadius: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  settingLabel: { ...Typography.body },
  settingRight: {},
  version: { textAlign: 'center', ...Typography.caption, marginTop: 32, marginBottom: 20 },
});
