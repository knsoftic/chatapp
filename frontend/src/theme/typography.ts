import { Platform, TextStyle } from 'react-native';

export const FontFamily = {
  regular: Platform.select({ ios: 'Inter-Regular', android: 'Inter-Regular', default: 'Inter, sans-serif' }),
  medium: Platform.select({ ios: 'Inter-Medium', android: 'Inter-Medium', default: 'Inter, sans-serif' }),
  semiBold: Platform.select({ ios: 'Inter-SemiBold', android: 'Inter-SemiBold', default: 'Inter, sans-serif' }),
  bold: Platform.select({ ios: 'Inter-Bold', android: 'Inter-Bold', default: 'Inter, sans-serif' }),
};

export const FontSize = {
  xs: 11,
  sm: 12,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
};

export const Typography = {
  h1: { fontSize: FontSize['5xl'], fontFamily: FontFamily.bold, lineHeight: 40 } as TextStyle,
  h2: { fontSize: FontSize['4xl'], fontFamily: FontFamily.bold, lineHeight: 34 } as TextStyle,
  h3: { fontSize: FontSize['3xl'], fontFamily: FontFamily.semiBold, lineHeight: 30 } as TextStyle,
  h4: { fontSize: FontSize['2xl'], fontFamily: FontFamily.semiBold, lineHeight: 26 } as TextStyle,
  h5: { fontSize: FontSize.xl, fontFamily: FontFamily.semiBold, lineHeight: 24 } as TextStyle,
  body: { fontSize: FontSize.base, fontFamily: FontFamily.regular, lineHeight: 22 } as TextStyle,
  bodyMedium: { fontSize: FontSize.base, fontFamily: FontFamily.medium, lineHeight: 22 } as TextStyle,
  caption: { fontSize: FontSize.sm, fontFamily: FontFamily.regular, lineHeight: 16 } as TextStyle,
  captionMedium: { fontSize: FontSize.sm, fontFamily: FontFamily.medium, lineHeight: 16 } as TextStyle,
  small: { fontSize: FontSize.xs, fontFamily: FontFamily.regular, lineHeight: 14 } as TextStyle,
};
