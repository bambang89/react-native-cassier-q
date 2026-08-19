import { useWindowDimensions } from 'react-native';

// 740 (bukan 768) supaya iPad mini ikut kehitung tablet — sisi pendeknya
// cuma 744pt (logical points), di bawah breakpoint iPad "standar" 768pt.
// Masih jauh di atas sisi pendek HP terbesar (~480pt), jadi tidak salah
// mengenali HP landscape sebagai tablet.
const TABLET_BREAKPOINT = 740;

export interface Responsive {
  width: number;
  height: number;
  isTablet: boolean;
  isLandscape: boolean;
  isTabletLandscape: boolean;
}

export function useResponsive(): Responsive {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = Math.min(width, height) >= TABLET_BREAKPOINT;

  return {
    width,
    height,
    isTablet,
    isLandscape,
    isTabletLandscape: isTablet && isLandscape,
  };
}
