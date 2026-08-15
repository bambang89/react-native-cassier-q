import { StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';
import { Text } from '@/components/ui/typography/Text';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral';

export interface BadgeProps {
  children: string;
  variant?: BadgeVariant;
}

const VARIANT_COLORS: Record<BadgeVariant, { bg: string; fg: string }> = {
  primary: { bg: colors.primary[100], fg: colors.primary[700] },
  success: { bg: colors.success[100], fg: colors.success[700] },
  warning: { bg: colors.warning[100], fg: colors.warning[700] },
  error: { bg: colors.error[100], fg: colors.error[700] },
  neutral: { bg: colors.gray[100], fg: colors.gray[700] },
};

// Badge dipakai untuk status singkat, mis. status pesanan ("Selesai",
// "Menunggu", "Dibatalkan") di layar Orders/Reports.
export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  const { bg, fg } = VARIANT_COLORS[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text size="xs" weight="semibold" style={{ color: fg }}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
});
