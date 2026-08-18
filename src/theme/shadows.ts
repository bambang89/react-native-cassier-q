import { Platform } from 'react-native';
import type { ViewStyle } from 'react-native';

function shadow(elevation: number, opacity: number, radius: number): ViewStyle {
  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
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
} as const;

export type ShadowToken = keyof typeof shadows;
