import { Dimensions, Platform } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';

import { TABLET_BREAKPOINT } from '@/hooks/useResponsive';

/**
 * Jenis device dari ukuran layar fisik (bukan window), jadi tidak berubah
 * saat diputar. Sisi pendek ≥ 740pt = tablet (termasuk iPad mini).
 */
export function isTabletDevice(): boolean {
  const { width, height } = Dimensions.get('screen');
  return Math.min(width, height) >= TABLET_BREAKPOINT;
}

/**
 * Tablet dikunci landscape (layout sidebar + split view), HP dikunci
 * portrait (layout bottom tab). Dipanggil sekali saat app start.
 */
export async function lockOrientationForDevice(): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    await ScreenOrientation.lockAsync(
      isTabletDevice() ? ScreenOrientation.OrientationLock.LANDSCAPE : ScreenOrientation.OrientationLock.PORTRAIT_UP,
    );
  } catch (error) {
    console.warn('[Orientation] gagal mengunci orientasi', error);
  }
}
