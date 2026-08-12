import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useTheme } from '../theme';
import { Typography } from '../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const { height } = Dimensions.get('window');

export default function WelcomeScreen({ navigation }: Props) {
  const { theme } = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.background}
      />

      {/* Hero Section */}
      <View style={styles.hero}>
        <LinearGradient
          colors={[theme.brand.primary + '33', theme.brand.accent + '22', 'transparent']}
          style={styles.heroGradient}
        />
        <View style={[styles.bubbleRow, styles.bubbleRowTop]}>
          {['Hey! 👋', 'Hello there!', '🎉'].map((text, i) => (
            <View
              key={i}
              style={[
                styles.dummyBubble,
                { backgroundColor: i % 2 === 0 ? theme.brand.outgoing : theme.colors.card },
              ]}
            >
              <Text style={[styles.bubbleText, { color: i % 2 === 0 ? '#fff' : theme.colors.text }]}>
                {text}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.logoBox, { backgroundColor: theme.brand.primary }]}>
          <Text style={styles.logoEmoji}>💬</Text>
        </View>

        <View style={[styles.bubbleRow, styles.bubbleRowBottom]}>
          {['How are you? 😊', 'Voice message 🎤', '📄 File'].map((text, i) => (
            <View
              key={i}
              style={[
                styles.dummyBubble,
                { backgroundColor: i % 2 !== 0 ? theme.brand.outgoing : theme.colors.card },
              ]}
            >
              <Text style={[styles.bubbleText, { color: i % 2 !== 0 ? '#fff' : theme.colors.text }]}>
                {text}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Bottom Content */}
      <View style={[styles.content, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.title, { color: theme.colors.text }]}>
          Fast &amp; Secure{'\n'}Messaging
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
          Connect with anyone using just a phone number.{'\n'}
          Text, voice, and file sharing — all in one place.
        </Text>

        <TouchableOpacity
          id="btn-get-started"
          style={[styles.primaryBtn, { backgroundColor: theme.brand.primary }]}
          onPress={() => navigation.navigate('Login')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryBtnText}>Get Started</Text>
        </TouchableOpacity>

        <Text style={[styles.terms, { color: theme.colors.textTertiary }]}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    paddingVertical: 40,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  logoBox: {
    width: 90,
    height: 90,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 20,
    elevation: 15,
    marginVertical: 20,
  },
  logoEmoji: { fontSize: 44 },
  bubbleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  bubbleRowTop: { marginBottom: 10, transform: [{ rotate: '-2deg' }] },
  bubbleRowBottom: { marginTop: 10, transform: [{ rotate: '2deg' }] },
  dummyBubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    opacity: 0.8,
  },
  bubbleText: { fontSize: 13, fontWeight: '500' },
  content: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
  },
  title: {
    ...Typography.h2,
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.body,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  terms: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});
