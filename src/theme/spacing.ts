// Skala spacing bernama, dipakai untuk padding/margin/gap di seluruh komponen
// supaya jarak antar elemen konsisten di semua layar.
export const spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
} as const;

export type SpacingToken = keyof typeof spacing;
