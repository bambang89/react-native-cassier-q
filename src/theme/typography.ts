import type { TextStyle } from 'react-native';

// Satu keluarga font untuk seluruh app: Plus Jakarta Sans (Tokotype, dirancang
// di Indonesia). x-height tinggi → tetap terbaca di ukuran kecil, karakter
// geometris yang ramah (sejalan dengan brand), dan punya angka tabular (tnum)
// sehingga harga/total di daftar & struk rata lurus.
export const fontFamily = 'PlusJakartaSans_400Regular';

export const fontFamilies = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  extrabold: 'PlusJakartaSans_800ExtraBold',
} satisfies Record<string, string>;

// Judul memakai keluarga yang sama — hierarki dibangun dari ukuran & bobot,
// bukan dari font kedua.
export const headingFontFamilies = fontFamilies;

/**
 * Nama file font untuk sebuah fontWeight. Di Expo tiap bobot adalah keluarga
 * font tersendiri; kalau style hanya menulis fontWeight: '700' tanpa
 * fontFamily yang cocok, iOS diam-diam jatuh ke font sistem.
 */
export function fontFamilyForWeight(weight: TextStyle['fontWeight'] | undefined): string {
  switch (String(weight ?? '400')) {
    case '500':
    case 'medium':
      return fontFamilies.medium;
    case '600':
    case 'semibold':
      return fontFamilies.semibold;
    case '700':
    case 'bold':
      return fontFamilies.bold;
    case '800':
    case '900':
    case 'heavy':
    case 'black':
      return fontFamilies.extrabold;
    default:
      return fontFamilies.regular;
  }
}

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
