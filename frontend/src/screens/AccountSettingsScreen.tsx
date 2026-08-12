import React, { useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useTheme } from '../theme';
import { Typography } from '../theme/typography';
import { useAuthStore } from '../store/authStore';
import { userApi } from '../services/api';
import { socketService } from '../services/socket';
import { notificationService } from '../services/notifications';
import { authApi } from '../services/api';
import { Ionicons } from '@expo/vector-icons';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountSettings'>;

export default function AccountSettingsScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const { user, setUser, logout } = useAuthStore();

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await userApi.updateMe({
        first_name: firstName,
        last_name: lastName,
        email: email || undefined,
        bio: bio || undefined,
      });
      setUser(response.data.data);
      Alert.alert('Saved', 'Profile updated successfully.');
    } catch {
      Alert.alert('Error', 'Failed to update profile.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all your data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await notificationService.unregisterDevice();
              await userApi.deleteAccount();
              socketService.disconnect();
              await logout();
            } catch {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
        <TouchableOpacity id="btn-back" onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>Account Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Mobile Number (read-only) */}
        <View style={[styles.readonlyField, { backgroundColor: theme.colors.card }]}>
          <Text style={[styles.readonlyLabel, { color: theme.colors.textSecondary }]}>Mobile Number</Text>
          <Text style={[styles.readonlyValue, { color: theme.colors.text }]}>{user?.mobile_number}</Text>
          <Text style={[styles.readonlyNote, { color: theme.colors.textTertiary }]}>
            Mobile number cannot be changed
          </Text>
        </View>

        {/* Editable Fields */}
        {[
          { label: 'First Name', value: firstName, setter: setFirstName, id: 'input-first-name', autoCapitalize: 'words' },
          { label: 'Last Name', value: lastName, setter: setLastName, id: 'input-last-name', autoCapitalize: 'words' },
          { label: 'Email (optional)', value: email, setter: setEmail, id: 'input-email', autoCapitalize: 'none', keyboardType: 'email-address' },
          { label: 'Bio (optional)', value: bio, setter: setBio, id: 'input-bio', autoCapitalize: 'sentences', multiline: true },
        ].map((field) => (
          <View key={field.id} style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>{field.label}</Text>
            <TextInput
              id={field.id}
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.inputBg,
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                },
                field.multiline && styles.multilineInput,
              ]}
              value={field.value}
              onChangeText={field.setter}
              autoCapitalize={field.autoCapitalize as any}
              keyboardType={field.keyboardType as any || 'default'}
              multiline={field.multiline}
              placeholderTextColor={theme.colors.placeholder}
            />
          </View>
        ))}

        <TouchableOpacity
          id="btn-save-profile"
          style={[styles.saveBtn, { backgroundColor: theme.brand.primary }, isSaving && styles.btnDisabled]}
          onPress={handleSave}
          disabled={isSaving}
          activeOpacity={0.85}
        >
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Save Changes</Text>}
        </TouchableOpacity>

        <TouchableOpacity
          id="btn-delete-account"
          style={[styles.deleteBtn, { borderColor: theme.brand.error }]}
          onPress={handleDeleteAccount}
          activeOpacity={0.85}
        >
          <Text style={[styles.deleteBtnText, { color: theme.brand.error }]}>Delete Account</Text>
        </TouchableOpacity>
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
  scrollContent: { paddingHorizontal: 20, paddingVertical: 20, gap: 16 },
  readonlyField: { borderRadius: 14, padding: 16 },
  readonlyLabel: { ...Typography.caption, marginBottom: 4 },
  readonlyValue: { ...Typography.bodyMedium, marginBottom: 4 },
  readonlyNote: { ...Typography.small },
  fieldGroup: { gap: 8 },
  label: { ...Typography.captionMedium },
  input: {
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 13,
    ...Typography.body,
  },
  multilineInput: { height: 80, textAlignVertical: 'top', paddingTop: 12 },
  saveBtn: {
    borderRadius: 14, paddingVertical: 14, alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10, elevation: 6,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  btnDisabled: { opacity: 0.7 },
  deleteBtn: {
    borderRadius: 14, paddingVertical: 14,
    alignItems: 'center', borderWidth: 1.5,
  },
  deleteBtnText: { fontWeight: '700', fontSize: 16 },
});
