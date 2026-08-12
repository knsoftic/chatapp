import React, { createContext, useContext, useState, useEffect } from 'react';
import { Appearance } from 'react-native';
import { Colors, ThemeMode } from './colors';
import { Typography, FontFamily, FontSize } from './typography';

export interface Theme {
  mode: ThemeMode;
  colors: typeof Colors.dark;
  brand: typeof Colors;
  typography: typeof Typography;
  fontFamily: typeof FontFamily;
  fontSize: typeof FontSize;
  spacing: typeof Spacing;
  borderRadius: typeof BorderRadius;
  shadows: typeof Shadows;
}

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const BorderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 24,
  full: 9999,
};

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.18,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 5,
  },
  lg: {
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
};

function buildTheme(mode: ThemeMode): Theme {
  return {
    mode,
    colors: mode === 'dark' ? Colors.dark : Colors.light,
    brand: Colors,
    typography: Typography,
    fontFamily: FontFamily,
    fontSize: FontSize,
    spacing: Spacing,
    borderRadius: BorderRadius,
    shadows: Shadows,
  };
}

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({
  theme: buildTheme('dark'),
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = Appearance.getColorScheme();
  const [mode, setMode] = useState<ThemeMode>((systemScheme as ThemeMode) || 'dark');

  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme) setMode(colorScheme as ThemeMode);
    });
    return () => subscription.remove();
  }, []);

  const toggleTheme = () => setMode((m) => (m === 'dark' ? 'light' : 'dark'));

  return (
    <ThemeContext.Provider value={{ theme: buildTheme(mode), toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): { theme: Theme; toggleTheme: () => void } {
  return useContext(ThemeContext);
}

export { Colors, Typography, FontFamily, FontSize };
