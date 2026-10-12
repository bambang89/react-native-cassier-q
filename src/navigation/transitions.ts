import { Easing } from 'react-native';
import type { BottomTabNavigationOptions } from '@react-navigation/bottom-tabs';

/**
 * Transisi pindah tab yang sama di HP & tablet: halaman lama memudar sambil
 * turun sedikit, halaman baru "terangkat" (fade + naik + skala 98,5% → 100%).
 * Lebih tenang dari geser penuh, cocok untuk app kasir yang sering pindah menu.
 */
export const tabTransition: Pick<BottomTabNavigationOptions, 'transitionSpec' | 'sceneStyleInterpolator'> = {
  transitionSpec: {
    animation: 'timing',
    config: { duration: 280, easing: Easing.out(Easing.cubic) },
  },
  sceneStyleInterpolator: ({ current }) => ({
    sceneStyle: {
      opacity: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [0, 1, 0] }),
      transform: [
        { translateY: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [14, 0, 14] }) },
        { scale: current.progress.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.985, 1, 0.985] }) },
      ],
    },
  }),
};
