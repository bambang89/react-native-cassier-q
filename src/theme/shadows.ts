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
  sm: shadow(1, 0.05, 2),
  md: shadow(3, 0.08, 4),
  lg: shadow(6, 0.1, 8),
  xl: shadow(10, 0.12, 16),
} as const;

export type ShadowToken = keyof typeof shadows;
