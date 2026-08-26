import { StyleSheet } from 'react-native';

import { Pressable } from '@/components/ui/forms';
import { Text } from '@/components/ui/typography';
import { colors, radii, spacing } from '@/theme';
import { tabletColors } from '@/theme/tabletColors';

// Dipakai bareng oleh POSScreen & ProductsScreen buat filter kategori —
// lewat `tablet` biar gaya menyesuaikan varian HP vs tablet-landscape
// masing-masing layar.
export function CategoryChip({
  label,
  active,
  tablet,
  onPress,
}: {
  label: string;
  active: boolean;
  tablet?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        tablet && styles.chipTablet,
        active && (tablet ? styles.chipActiveTablet : styles.chipActive),
      ]}
    >
      <Text
        size="sm"
        weight="semibold"
        color={active ? 'inverse' : 'secondary'}
        style={tablet && !active ? styles.chipLabelTablet : undefined}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  chipTablet: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderColor: tabletColors.gray200,
    backgroundColor: tabletColors.white,
  },
  chipActiveTablet: { backgroundColor: tabletColors.navy900, borderColor: tabletColors.navy900 },
  chipLabelTablet: { color: tabletColors.gray600 },
});
