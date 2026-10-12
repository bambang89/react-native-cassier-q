import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

// Bayangan bernuansa navy (bukan hitam murni) — lebih lembut & "mahal" di atas latar terang.
function shadow(elevation: number, opacity: number, radius: number): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#0B1F33',
      shadowOffset: { width: 0, height: Math.ceil(elevation / 2) },
      shadowOpacity: opacity,
      shadowRadius: radius,
    },
    android: { elevation },
    default: {},
  }) as ViewStyle;
}

export const shadows = {
  none: {} as ViewStyle,
  // sm/md/lg diturunkan dari --shadow-sm/md/lg di cassier-q-webapp/components.html.
  // xs/xl tetap step tambahan kita sendiri (tidak ada di webapp) buat kasus di antaranya.
  xs: shadow(1, 0.08, 2),
  sm: shadow(2, 0.05, 2),
  md: shadow(4, 0.06, 6),
  lg: shadow(16, 0.14, 28),
  xl: shadow(10, 0.14, 16),
  // Kartu: bayangan tipis menyebar — dipakai Card bawaan.
  card: shadow(2, 0.06, 10),
  // Elemen melayang (tombol Kasir di tab bar, FAB, bottom sheet).
  float: shadow(12, 0.22, 18),
} as const;

export type ShadowToken = keyof typeof shadows;
