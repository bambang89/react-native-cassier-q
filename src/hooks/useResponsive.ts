import { useWindowDimensions } from 'react-native';

const TABLET_BREAKPOINT = 768;

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
