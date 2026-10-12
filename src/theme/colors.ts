// Warna dasar (skala 50-900 gaya Tailwind) yang jadi rujukan seluruh UI kit.
// Disamakan dengan :root di cassier-q-webapp (mobile-*.html & tablet-*.html),
// jadi mode HP dan tablet memakai satu palet yang sama dengan mockup desain.
// Navy, Blue, Emerald, dan Teal tetap 4 warna inti brand.

// Blue #2563EB — warna aksi utama (tombol, link, state aktif).
export const royal = {
  50: '#EFF4FF',
  100: '#DCE7FE',
  200: '#BFD3FE',
  300: '#93B4FD',
  400: '#60A5FA',
  500: '#3B82F6',
  600: '#2563EB',
  700: '#1D4ED8',
  800: '#1E40AF',
  900: '#1E3A8A',
} as const;

// Netral slate (sedikit kebiruan) — --gray-* di cassier-q-webapp.
export const gray = {
  50: '#F8FAFC',
  100: '#EEF1F5',
  200: '#E2E8F0',
  300: '#CBD5E1',
  400: '#94A3B8',
  500: '#64748B',
  600: '#475569',
  700: '#334155',
  800: '#1E293B',
  900: '#0F172A',
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

// Emerald #059669 — sukses/uang/konfirmasi, dipakai secukupnya sebagai aksen.
export const emerald = {
  50: '#ECFDF5',
  100: '#D1FAE5',
  200: '#A7F3D0',
  300: '#6EE7B7',
  400: '#34D399',
  500: '#10B981',
  600: '#059669',
  700: '#047857',
  800: '#065F46',
  900: '#064E3B',
} as const;

// Teal #0F766E — aksen kedua brand, dipakai untuk warna "info".
export const teal = {
  50: '#F0FDFA',
  100: '#CCFBF1',
  200: '#99F6E4',
  300: '#5EEAD4',
  400: '#2DD4BF',
  500: '#14B8A6',
  600: '#0D9488',
  700: '#0F766E',
  800: '#115E59',
  900: '#134E4A',
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

  // Latar gelap penuh (rail navigasi, hero, kartu insight) — navy webapp.
  darkBg: '#0B1F33',
  darkCard: '#122A44',

  // background = permukaan putih (kartu, input, sheet); canvas = latar layar
  // abu-abu sangat muda di belakang kartu, seperti mockup.
  background: '#FFFFFF',
  canvas: '#F5F7FB',
  surface: gray[50],
  border: '#E7EBF1',
  borderStrong: gray[300],

  text: {
    primary: gray[900],
    secondary: gray[600],
    muted: gray[500],
    inverse: '#ffffff',
    link: royal[600],
    danger: red[600],
  },

  overlay: 'rgba(11,31,51,0.45)',
  overlayStrong: 'rgba(11,31,51,0.65)',
} as const;

export type ColorScale = typeof royal;
export type Colors = typeof colors;
