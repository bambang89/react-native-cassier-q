export * from './colors';
export * from './spacing';
export * from './radii';
export * from './typography';
export * from './shadows';

import { colors } from './colors';
import { spacing } from './spacing';
import { radii } from './radii';
import { fontFamilies, fontFamily, fontSizes, fontWeights, lineHeights } from './typography';
import { shadows } from './shadows';

// Objek gabungan untuk kasus yang butuh akses satu pintu, mis. `theme.colors.primary[600]`.
export const theme = {
  colors,
  spacing,
  radii,
  typography: { fontFamily, fontFamilies, fontSizes, fontWeights, lineHeights },
  shadows,
} as const;

export type Theme = typeof theme;
