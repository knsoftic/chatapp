import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, SafeAreaView,
  TextInput, ActivityIndicator, Alert, ScrollView, Image,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useTheme } from '../theme';
import { Typography } from '../theme/typography';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import * as ImagePicker from 'expo-image-picker';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileSetup'>;

export default function ProfileSetupScreen({ navigation, route }: Props) {
  const { mobile_number, otp_token } = route.params;
  const { theme } = useTheme();
  const { login } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required', 'Please enter your first and last name.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authApi.register({
        mobile_number,
        otp_token,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
      });
      const { user, access_token, refresh_token } = response.data.data;
      await login(user, { access_token, refresh_token });
    } catch (err: any) {
      Alert.alert('Error', err?.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: theme.colors.text }]}>Set Up Your Profile</Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Add your name so others can find you
        </Text>

        {/* Avatar Picker */}
        <TouchableOpacity id="btn-pick-avatar" onPress={handlePickImage} style={styles.avatarContainer}>
          {avatar ? (
            <Image source={{ uri: avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.colors.card }]}>
              <Text style={styles.avatarEmoji}>👤</Text>
            </View>
          )}
          <View style={[styles.avatarEditBadge, { backgroundColor: theme.brand.primary }]}>
            <Text style={styles.avatarEditIcon}>✏️</Text>
          </View>
        </TouchableOpacity>

        {/* Form Fields */}
        <View style={styles.form}>
          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>First Name *</Text>
            <TextInput
              id="input-first-name"
              style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Enter first name"
              placeholderTextColor={theme.colors.placeholder}
              value={firstName}
              onChangeText={setFirstName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>Last Name *</Text>
            <TextInput
              id="input-last-name"
              style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Enter last name"
              placeholderTextColor={theme.colors.placeholder}
              value={lastName}
              onChangeText={setLastName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.label, { color: theme.colors.textSecondary }]}>
              Email{' '}
              <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>(optional)</Text>
            </Text>
            <TextInput
              id="input-email"
              style={[styles.input, { backgroundColor: theme.colors.inputBg, borderColor: theme.colors.border, color: theme.colors.text }]}
              placeholder="Enter email address"
              placeholderTextColor={theme.colors.placeholder}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.mobileDisplay, { backgroundColor: theme.colors.card }]}>
            <Text style={[styles.mobileLabel, { color: theme.colors.textTertiary }]}>Mobile Number</Text>
            <Text style={[styles.mobileNumber, { color: theme.colors.text }]}>{mobile_number}</Text>
          </View>
        </View>

        <TouchableOpacity
          id="btn-finish-setup"
          style={[styles.submitBtn, { backgroundColor: theme.brand.primary }, isLoading && styles.btnDisabled]}
          onPress={handleSubmit}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitBtnText}>Create Account →</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 28, paddingTop: 40, paddingBottom: 40, alignItems: 'center' },
  title: { ...Typography.h3, marginBottom: 10, textAlign: 'center' },
  subtitle: { ...Typography.body, marginBottom: 32, textAlign: 'center' },
  avatarContainer: { position: 'relative', marginBottom: 32 },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarPlaceholder: {
    width: 100, height: 100, borderRadius: 50,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEmoji: { fontSize: 44 },
  avatarEditBadge: {
    position: 'absolute', bottom: 0, right: 0,
    width: 30, height: 30, borderRadius: 15,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarEditIcon: { fontSize: 14 },
  form: { width: '100%', gap: 20, marginBottom: 32 },
  fieldGroup: { gap: 8 },
  label: { ...Typography.captionMedium },
  input: {
    borderWidth: 1.5, borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    ...Typography.body,
  },
  mobileDisplay: {
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14,
  },
  mobileLabel: { ...Typography.caption, marginBottom: 4 },
  mobileNumber: { ...Typography.bodyMedium },
  submitBtn: {
    width: '100%', borderRadius: 16, paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  submitBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  btnDisabled: { opacity: 0.7 },
});
