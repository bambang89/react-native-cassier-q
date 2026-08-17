import type { TextStyle } from 'react-native';

export const fontFamily = 'PlusJakartaSans_400Regular';

export const fontFamilies = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} satisfies Record<string, string>;

export const fontSizes = {
  xs: 13,
  sm: 14,
  md: 15,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 22,
  '3xl': 26,
  '4xl': 30,
  '5xl': 36,
  '6xl': 44,
} as const;

export const fontWeights = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
} satisfies Record<string, TextStyle['fontWeight']>;

export const lineHeights = {
  tight: 1.2,
  normal: 1.45,
  relaxed: 1.65,
} as const;

export type FontSizeToken = keyof typeof fontSizes;
export type FontWeightToken = keyof typeof fontWeights;
