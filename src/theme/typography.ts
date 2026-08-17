import type { TextStyle } from 'react-native';

// Tidak ada custom font yang di-load (lihat assets/), jadi fontFamily
// dibiarkan undefined supaya jatuh ke font sistem default per platform.
export const fontFamily: string | undefined = undefined;

// Skala dinaikkan dari default umum supaya nyaman dibaca pengguna usia 30-50+
// (mata makin butuh ukuran huruf lebih besar & lebih tebal buat baca cepat,
// apalagi di kondisi toko yang kadang remang). `base` (teks body default)
// sengaja di atas 16px — standar minimum aksesibilitas umum.
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
