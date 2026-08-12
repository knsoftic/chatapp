import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { LinearGradient } from 'expo-linear-gradient';
import { RootStackParamList } from '../navigation';
import { useTheme } from '../theme';
import { Typography } from '../theme/typography';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../services/api';

type Props = NativeStackScreenProps<RootStackParamList, 'OTP'>;

const OTP_LENGTH = 6;

export default function OTPScreen({ navigation, route }: Props) {
  const { theme } = useTheme();
  const { mobile_number, purpose } = route.params;
  const { setAuth } = useAuthStore();

  const [code, setCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const inputRef = useRef<TextInput>(null);

  const isNewUser = purpose === 'REGISTRATION';

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 400);
    startCountdown();
  }, []);

  useEffect(() => {
    if (code.length === OTP_LENGTH) handleVerify(code);
  }, [code]);

  const startCountdown = () => {
    setCountdown(60);
    setCanResend(false);
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerify = async (otpCode: string) => {
    if (otpCode.length < OTP_LENGTH || isVerifying) return;
    setIsVerifying(true);
    try {
      const response = await authApi.verifyOtp(mobile_number, otpCode, purpose);
      const data = response.data?.data;

      if (data?.access_token) {
        // Existing user — direct login to Home
        await setAuth(data.user, data.access_token, data.refresh_token);
        navigation.reset({ index: 0, routes: [{ name: 'Home' }] });
      } else {
        // New user — navigate to ProfileSetup
        navigation.navigate('ProfileSetup', {
          mobile_number,
          otp_token: data?.otp_token || 'verified',
        });
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || 'Invalid verification code. Please try again.';
      Alert.alert('Verification Failed', msg);
      setCode('');
      inputRef.current?.focus();
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || isResending) return;
    setIsResending(true);
    try {
      await authApi.sendOtp(mobile_number, purpose);
      setCode('');
      startCountdown();
      Alert.alert('Code Sent', 'A new verification code has been sent to your number.');
    } catch {
      Alert.alert('Error', 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const boxes = Array.from({ length: OTP_LENGTH });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity id="btn-back" onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={[styles.backArrow, { color: theme.colors.text }]}>←</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Badge */}
          <View style={[styles.badge, { backgroundColor: isNewUser ? '#7C3AED22' : '#4F46E522' }]}>
            <Text style={[styles.badgeText, { color: isNewUser ? '#A78BFA' : '#818CF8' }]}>
              {isNewUser ? '✨ Creating Account' : '👋 Welcome Back'}
            </Text>
          </View>

          <Text style={[styles.heading, { color: theme.colors.text }]}>
            Verification Code
          </Text>
          <Text style={[styles.subheading, { color: theme.colors.textSecondary }]}>
            Enter the 6-digit code sent to{'\n'}
            <Text style={{ color: theme.brand.primary, fontWeight: '700' }}>
              {mobile_number}
            </Text>
          </Text>

          {/* OTP Boxes */}
          <View style={styles.otpRow}>
            {boxes.map((_, i) => {
              const isActive = code.length === i;
              const filled = code[i];
              return (
                <TouchableOpacity
                  key={i}
                  onPress={() => inputRef.current?.focus()}
                  activeOpacity={0.8}
                >
                  <View style={[
                    styles.otpBox,
                    { borderColor: theme.colors.border, backgroundColor: theme.colors.inputBg },
                    isActive && { borderColor: theme.brand.primary, borderWidth: 2.5 },
                    filled && { borderColor: theme.brand.primary + '88' },
                  ]}>
                    {isVerifying && i === code.length - 1 ? (
                      <ActivityIndicator size="small" color={theme.brand.primary} />
                    ) : (
                      <Text style={[styles.otpDigit, { color: theme.colors.text }]}>
                        {filled || ''}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Hidden input */}
          <TextInput
            ref={inputRef}
            style={styles.hiddenInput}
            value={code}
            onChangeText={(v) => setCode(v.replace(/\D/g, '').slice(0, OTP_LENGTH))}
            keyboardType="number-pad"
            maxLength={OTP_LENGTH}
            autoFocus
          />

          {/* Resend */}
          <TouchableOpacity
            id="btn-resend"
            onPress={handleResend}
            disabled={!canResend || isResending}
            activeOpacity={0.7}
          >
            <Text style={[styles.resendText, { color: canResend ? theme.brand.primary : theme.colors.textTertiary }]}>
              {isResending ? 'Sending...' : canResend ? 'Resend Code' : `Resend in ${countdown}s`}
            </Text>
          </TouchableOpacity>

          {/* Verify button (manual fallback) */}
          {code.length === OTP_LENGTH && !isVerifying && (
            <TouchableOpacity
              id="btn-verify"
              onPress={() => handleVerify(code)}
              activeOpacity={0.85}
              style={{ marginTop: 24 }}
            >
              <LinearGradient
                colors={['#4F46E5', '#7C3AED']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.verifyBtn}
              >
                <Text style={styles.verifyBtnText}>Verify →</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 8 },
  backBtn: { padding: 10 },
  backArrow: { fontSize: 24 },
  content: { flex: 1, paddingHorizontal: 28, paddingTop: 20, alignItems: 'center' },
  badge: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, marginBottom: 20,
  },
  badgeText: { fontSize: 13, fontWeight: '700' },
  heading: { ...Typography.h3, textAlign: 'center', marginBottom: 10 },
  subheading: { ...Typography.body, textAlign: 'center', marginBottom: 36, lineHeight: 24 },
  otpRow: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  otpBox: {
    width: 48, height: 58, borderRadius: 14, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  otpDigit: { fontSize: 22, fontWeight: '800' },
  hiddenInput: {
    position: 'absolute', opacity: 0, width: 1, height: 1,
  },
  resendText: { ...Typography.bodyMedium, marginTop: 8 },
  verifyBtn: { borderRadius: 16, paddingVertical: 15, paddingHorizontal: 48 },
  verifyBtnText: { color: '#fff', fontSize: 17, fontWeight: '800' },
});
