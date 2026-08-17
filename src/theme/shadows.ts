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
  // Skala xs/sm/md/lg mengikuti spec box-shadow di Figma (blur & elevasinya),
  // dengan opacity sedikit dinaikkan dari nilai desain aslinya karena di
  // layar terang bayangan setipis itu nyaris tidak kelihatan — padahal
  // kartu/tombol butuh terasa "bisa ditekan" biar tidak terkesan datar.
  xs: shadow(1, 0.08, 2),
  sm: shadow(2, 0.1, 3),
  md: shadow(4, 0.1, 8),
  lg: shadow(8, 0.1, 16),
  xl: shadow(10, 0.14, 16),
} as const;

export type ShadowToken = keyof typeof shadows;
