import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  KeyboardAvoidingView, Platform, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../navigation';
import { useTheme } from '../theme';
import { Typography } from '../theme/typography';
import { authApi } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

const COUNTRY_CODES = [
  { code: '+92', flag: '🇵🇰', name: 'Pakistan' },
  { code: '+1',  flag: '🇺🇸', name: 'USA' },
  { code: '+44', flag: '🇬🇧', name: 'UK' },
  { code: '+91', flag: '🇮🇳', name: 'India' },
  { code: '+971',flag: '🇦🇪', name: 'UAE' },
  { code: '+966',flag: '🇸🇦', name: 'KSA' },
];

export default function LoginScreen({ navigation }: Props) {
  const { theme } = useTheme();
  const [countryCode, setCountryCode] = useState('+92');
  const [showPicker, setShowPicker] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => { setTimeout(() => inputRef.current?.focus(), 500); }, []);

  const formattedNumber = `${countryCode}${phoneNumber.replace(/\D/g, '')}`;
  const isValid = phoneNumber.replace(/\D/g, '').length >= 7;

  const handleContinue = async () => {
    if (!isValid) {
      Alert.alert('Invalid Number', 'Please enter a valid mobile number.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await authApi.sendOtp(formattedNumber, 'LOGIN');
      const data = response.data?.data || {};
      navigation.navigate('OTP', {
        mobile_number: formattedNumber,
        purpose: data.purpose || 'REGISTRATION',
      });
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Failed to send verification code. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

          {/* Top gradient logo area */}
          <LinearGradient
            colors={['#4F46E5', '#7C3AED', '#0A0E1A']}
            style={styles.topGradient}
          >
            <View style={styles.logoCircle}>
              <Text style={styles.logoEmoji}>💬</Text>
            </View>
            <Text style={styles.appName}>ChatApp</Text>
          </LinearGradient>

          {/* Content */}
          <View style={styles.content}>
            <Text style={[styles.heading, { color: theme.colors.text }]}>
              Enter Your Mobile Number
            </Text>
            <Text style={[styles.subheading, { color: theme.colors.textSecondary }]}>
              We'll automatically create your account or sign you in
            </Text>

            {/* Phone Input */}
            <View style={[styles.phoneRow, {
              backgroundColor: theme.colors.inputBg,
              borderColor: theme.colors.border,
            }]}>
              {/* Country picker */}
              <TouchableOpacity
                id="btn-country-picker"
                style={[styles.countryBtn, { borderRightColor: theme.colors.border }]}
                onPress={() => setShowPicker(!showPicker)}
                activeOpacity={0.7}
              >
                <Text style={styles.flag}>{selectedCountry.flag}</Text>
                <Text style={[styles.countryCode, { color: theme.colors.text }]}>
                  {selectedCountry.code}
                </Text>
                <Text style={{ color: theme.colors.textTertiary, fontSize: 12 }}>▾</Text>
              </TouchableOpacity>

              <TextInput
                ref={inputRef}
                id="input-phone-number"
                style={[styles.phoneInput, { color: theme.colors.text }]}
                placeholder="300 1234567"
                placeholderTextColor={theme.colors.placeholder}
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                keyboardType="phone-pad"
                returnKeyType="done"
                onSubmitEditing={handleContinue}
              />
            </View>

            {/* Country Picker Dropdown */}
            {showPicker && (
              <View style={[styles.pickerDropdown, {
                backgroundColor: theme.colors.card,
                borderColor: theme.colors.border,
              }]}>
                {COUNTRY_CODES.map((c) => (
                  <TouchableOpacity
                    key={c.code}
                    style={[styles.pickerItem, { borderBottomColor: theme.colors.divider }]}
                    onPress={() => { setCountryCode(c.code); setShowPicker(false); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.flag}>{c.flag}</Text>
                    <Text style={[styles.pickerCountry, { color: theme.colors.text }]}>
                      {c.name}
                    </Text>
                    <Text style={[styles.pickerCode, { color: theme.colors.textSecondary }]}>
                      {c.code}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            <Text style={[styles.hint, { color: theme.colors.textTertiary }]}>
              New users will be registered automatically
            </Text>

            {/* Continue Button */}
            <TouchableOpacity
              id="btn-continue"
              onPress={handleContinue}
              disabled={isLoading || !isValid}
              activeOpacity={0.85}
              style={[styles.continueBtn, (!isValid || isLoading) && { opacity: 0.6 }]}
            >
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.continueBtnGradient}
              >
                {isLoading
                  ? <ActivityIndicator color="#fff" />
                  : <Text style={styles.continueBtnText}>Continue →</Text>
                }
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.terms, { color: theme.colors.textTertiary }]}>
              By continuing, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1 },
  topGradient: {
    paddingTop: 60,
    paddingBottom: 48,
    alignItems: 'center',
  },
  logoCircle: {
    width: 80, height: 80, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  logoEmoji: { fontSize: 40 },
  appName: {
    fontSize: 26, fontWeight: '800', color: '#fff', letterSpacing: 0.5,
  },
  content: { paddingHorizontal: 24, paddingTop: 36, paddingBottom: 40 },
  heading: { ...Typography.h3, marginBottom: 8, textAlign: 'center' },
  subheading: { ...Typography.body, textAlign: 'center', marginBottom: 32, lineHeight: 22 },
  phoneRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderRadius: 16, overflow: 'hidden', marginBottom: 12,
    height: 58,
  },
  countryBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, borderRightWidth: 1, height: '100%',
  },
  flag: { fontSize: 22 },
  countryCode: { fontSize: 15, fontWeight: '700' },
  phoneInput: {
    flex: 1, paddingHorizontal: 16, fontSize: 16, fontWeight: '500', height: '100%',
  },
  pickerDropdown: {
    borderRadius: 14, borderWidth: 1,
    marginBottom: 12, overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 13,
    borderBottomWidth: 1, gap: 12,
  },
  pickerCountry: { flex: 1, ...Typography.bodyMedium },
  pickerCode: { ...Typography.captionMedium },
  hint: { ...Typography.caption, textAlign: 'center', marginBottom: 28 },
  continueBtn: { borderRadius: 16, overflow: 'hidden', marginBottom: 20 },
  continueBtnGradient: {
    paddingVertical: 16, alignItems: 'center',
  },
  continueBtnText: { color: '#fff', fontSize: 17, fontWeight: '800', letterSpacing: 0.4 },
  terms: { ...Typography.small, textAlign: 'center', lineHeight: 18 },
});
