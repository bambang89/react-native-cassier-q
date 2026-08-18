// Warna dasar (skala 50-900 gaya Tailwind) yang jadi rujukan seluruh UI kit.
// Sumber: cassier-q-brand-presentation.html (bagian "04 — Color System" +
// variabel :root) — Deep Navy, Royal Blue, Emerald, dan Dark Teal adalah 4
// warna resmi brand; skala di bawah dibangun di sekitar nilai persis itu.

// Royal Blue #1450C4 — warna aksi utama (tombol, link, state aktif).
export const royal = {
  50: '#EAF1FF',
  100: '#D3E3FF',
  200: '#A8C7FF',
  300: '#85AEFF',
  400: '#5B8CFF',
  500: '#3D7BFF',
  600: '#1450C4',
  700: '#0F3D99',
  800: '#0B2C70',
  900: '#0B1F3A',
} as const;

// Netral yang condong ke Deep Navy (bukan abu-abu polos) — dari --ink,
// --muted, dan --line di file brand, biar teks & border ikut terasa branded.
export const gray = {
  50: '#F2F4F8',
  100: '#E9EDF3',
  200: '#E4E8EE',
  300: '#C6D2E6',
  400: '#9FB6D6',
  500: '#7186A6',
  600: '#5B6B82',
  700: '#3F4E66',
  800: '#1F2D42',
  900: '#0B1F3A',
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

// Emerald #0E7A5B — sukses/uang/konfirmasi, dipakai secukupnya sebagai aksen.
export const emerald = {
  50: '#EAFBF4',
  100: '#C9F3E1',
  200: '#9FD9C0',
  300: '#5FD1A3',
  400: '#22B888',
  500: '#189E76',
  600: '#0E7A5B',
  700: '#0B5F47',
  800: '#094835',
  900: '#063326',
} as const;

// Dark Teal #0E5C63 — aksen kedua brand, dipakai untuk warna "info".
export const teal = {
  50: '#E8F3F4',
  100: '#C9E4E6',
  200: '#9BCBCF',
  300: '#6BB0B6',
  400: '#3D949C',
  500: '#1D7B84',
  600: '#0E5C63',
  700: '#0B4850',
  800: '#08363C',
  900: '#062429',
} as const;

export const colors = {
  primary: royal,
  gray,
  red,
  amber,
  teal,
  success: emerald,
  error: red,
  warning: amber,
  info: teal,

  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',

  // Latar gelap penuh (rail navigasi, hero) — persis --darkbg/--darkcard di file brand.
  darkBg: '#0A1830',
  darkCard: '#0F2748',

  background: '#FAFBFC',
  surface: gray[50],
  border: gray[200],
  borderStrong: gray[300],

  text: {
    primary: gray[900],
    secondary: gray[600],
    muted: gray[500],
    inverse: '#ffffff',
    link: royal[600],
    danger: red[600],
  },

  overlay: 'rgba(0,0,0,0.4)',
  overlayStrong: 'rgba(0,0,0,0.6)',
} as const;

export type ColorScale = typeof royal;
export type Colors = typeof colors;
