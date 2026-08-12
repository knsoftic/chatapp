import React, { useEffect } from 'react';
import { View, StyleSheet, Animated, Easing } from 'react-native';
import { useTheme } from '../theme';
import { useAuthStore } from '../store/authStore';
import { Typography } from '../theme/typography';

export default function SplashScreen() {
  const { theme } = useTheme();
  const { initialize } = useAuthStore();
  const scaleAnim = new Animated.Value(0.5);
  const opacityAnim = new Animated.Value(0);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        easing: Easing.elastic(1.2),
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();

    initialize();
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
        <View style={[styles.logoContainer, { backgroundColor: theme.brand.primary }]}>
          <Animated.Text style={[styles.logoEmoji]}>💬</Animated.Text>
        </View>
        <Animated.Text style={[styles.appName, { color: theme.colors.text }]}>
          ChatApp
        </Animated.Text>
        <Animated.Text style={[styles.tagline, { color: theme.colors.textSecondary }]}>
          Connect. Chat. Share.
        </Animated.Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 20,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  logoEmoji: {
    fontSize: 48,
  },
  appName: {
    ...Typography.h2,
    textAlign: 'center',
    marginBottom: 8,
  },
  tagline: {
    ...Typography.body,
    textAlign: 'center',
  },
});
