import { StyleSheet } from 'react-native';

import { colors, radii, spacing } from '@/theme';
import { tabletColors } from '@/theme/tabletColors';

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  containerTablet: { backgroundColor: tabletColors.gray25 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  lowStockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning[200],
    backgroundColor: colors.warning[50],
  },
  lowStockBannerText: { flex: 1 },
  lowStockGlyph: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.warning[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: { paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing['2xl'] },
  empty: { marginTop: spacing['3xl'] },
  tabletBody: { flex: 1, paddingVertical: 22, paddingHorizontal: 24, backgroundColor: tabletColors.gray25 },
  tabletSearchRow: { marginBottom: 14 },
  tabletSearchInput: { flex: 1 },
  categoryRow: { paddingHorizontal: spacing.base, paddingBottom: 10, gap: spacing.sm, alignItems: 'center' },
  grid: { paddingBottom: spacing['2xl'] },
  gridRow: { gap: 14 },
});
