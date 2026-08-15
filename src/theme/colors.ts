// Warna dasar (skala 50-900 gaya Tailwind) yang jadi rujukan seluruh UI kit.
// Primary hijau (#16a34a) sengaja disamakan dengan warna yang sudah dipakai
// di layar-layar existing (Login/Register/POS) supaya migrasi ke komponen
// global ini tidak mengubah tampilan yang sudah ada.
export const green = {
  50: '#f0fdf4',
  100: '#dcfce7',
  200: '#bbf7d0',
  300: '#86efac',
  400: '#4ade80',
  500: '#22c55e',
  600: '#16a34a',
  700: '#15803d',
  800: '#166534',
  900: '#14532d',
} as const;

export const gray = {
  50: '#f9fafb',
  100: '#f3f4f6',
  200: '#e5e7eb',
  300: '#d1d5db',
  400: '#9ca3af',
  500: '#6b7280',
  600: '#4b5563',
  700: '#374151',
  800: '#1f2937',
  900: '#111827',
} as const;

export const red = {
  50: '#fef2f2',
  100: '#fee2e2',
  200: '#fecaca',
  300: '#fca5a5',
  500: '#ef4444',
  600: '#dc2626',
  700: '#b91c1c',
} as const;

export const amber = {
  50: '#fffbeb',
  100: '#fef3c7',
  200: '#fde68a',
  300: '#fcd34d',
  500: '#f59e0b',
  600: '#d97706',
  700: '#b45309',
} as const;

export const blue = {
  50: '#eff6ff',
  100: '#dbeafe',
  200: '#bfdbfe',
  300: '#93c5fd',
  500: '#3b82f6',
  600: '#2563eb',
  700: '#1d4ed8',
} as const;

export const colors = {
  primary: green,
  gray,
  red,
  amber,
  blue,
  success: green,
  error: red,
  warning: amber,
  info: blue,

  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  background: '#ffffff',
  surface: gray[50],
  border: gray[200],
  borderStrong: gray[300],

  text: {
    primary: gray[900],
    secondary: gray[600],
    muted: gray[400],
    inverse: '#ffffff',
    link: green[600],
    danger: red[600],
  },

  overlay: 'rgba(0,0,0,0.4)',
  overlayStrong: 'rgba(0,0,0,0.6)',
} as const;

export type ColorScale = typeof green;
export type Colors = typeof colors;
