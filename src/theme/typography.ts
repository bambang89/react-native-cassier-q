import type { TextStyle } from 'react-native';

// Tidak ada custom font yang di-load (lihat assets/), jadi fontFamily
// dibiarkan undefined supaya jatuh ke font sistem default per platform.
export const fontFamily: string | undefined = undefined;

export const fontSizes = {
  xs: 12,
  sm: 13,
  md: 14,
  base: 15,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 28,
  '5xl': 32,
  '6xl': 40,
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
  normal: 1.4,
  relaxed: 1.6,
} as const;

export type FontSizeToken = keyof typeof fontSizes;
export type FontWeightToken = keyof typeof fontWeights;
