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
  // sm dinaikkan sedikit dari opacity .05 — di layar terang, bayangan setipis
  // itu nyaris tidak kelihatan, padahal kartu/tombol butuh terasa "bisa
  // ditekan" biar tidak terkesan datar & membosankan.
  sm: shadow(2, 0.09, 3),
  md: shadow(3, 0.1, 4),
  lg: shadow(6, 0.12, 8),
  xl: shadow(10, 0.14, 16),
} as const;

export type ShadowToken = keyof typeof shadows;
