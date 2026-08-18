// Sesuai skala radius di cassier-q-webapp/components.html (--r-sm..--r-2xl).
export const radii = {
  none: 0,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  '2xl': 20,
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radii;
