// Palet warna khusus mode tablet-landscape — nilai hex persis :root di
// cassier-q-webapp/tablet-*.html (dashboard/pos/products/transactions/settings
// semua berbagi blok :root yang identik). Sengaja terpisah dari src/theme/colors.ts
// (brand warna app di mode HP) supaya mode HP tidak ikut berubah.
export const tabletColors = {
  navy900: '#0B1F33',
  navy800: '#122A44',
  navy700: '#1A3654',

  blue600: '#2563EB',
  blue700: '#1D4ED8',
  blue500: '#3B82F6',
  blue100: '#DCE7FE',
  blue50: '#EFF4FF',

  emerald600: '#059669',
  emerald500: '#10B981',
  emerald100: '#D1FAE5',
  emerald50: '#ECFDF5',

  teal700: '#0F766E',
  teal100: '#CCFBF1',
  teal50: '#F0FDFA',

  amber600: '#D97706',
  amber100: '#FEF3C7',
  amber50: '#FFFBEB',

  red600: '#DC2626',
  red100: '#FEE2E2',
  red50: '#FEF2F2',

  white: '#FFFFFF',
  gray25: '#F7F9FC',
  gray50: '#F8FAFC',
  gray100: '#EEF1F5',
  gray150: '#E7EBF1',
  gray200: '#E2E8F0',
  gray300: '#CBD5E1',
  gray400: '#94A3B8',
  gray500: '#64748B',
  gray600: '#475569',
  gray700: '#334155',
  gray800: '#1E293B',
  gray900: '#0F172A',
} as const;

// Dimensi layout khusus tablet — persis .tablet-sidebar/.tablet-topbar/.split-list
// di cassier-q-webapp/tablet-*.html.
export const tabletLayout = {
  sidebarWidth: 82,
  topBarHeight: 64,
  topBarPaddingHorizontal: 24,
  splitListWidth: 330,
  touchTargetMinHeight: 46,
} as const;

export type TabletColors = typeof tabletColors;
