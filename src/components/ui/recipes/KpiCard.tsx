import { StyleSheet, View } from 'react-native';
import type { ComponentType } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radii, spacing } from '@/theme';
import type { LineIconProps } from '@/components/icons/LineIcons';
import { TrendDownIcon, TrendUpIcon } from '@/components/icons/LineIcons';
import { Card } from './Card';
import { Heading, Text } from '@/components/ui/typography';

export interface KpiCardProps {
  label: string;
  value: string;
  icon: ComponentType<LineIconProps>;
  iconColor: string;
  iconBg: string;
  delta?: number | null;
  style?: StyleProp<ViewStyle>;
}

export function KpiCard({ label, value, icon: Icon, iconColor, iconBg, delta, style }: KpiCardProps) {
  return (
    <Card style={[styles.card, style]}>
      <View style={styles.head}>
        <Text size="xs" color="secondary" weight="medium" numberOfLines={1} style={styles.label}>
          {label}
        </Text>
        <View style={[styles.iconChip, { backgroundColor: iconBg }]}>
          <Icon size={15} color={iconColor} />
        </View>
      </View>
      <Heading level="h4" style={styles.value}>
        {value}
      </Heading>
      {delta !== undefined && delta !== null ? (
        <View style={styles.delta}>
          {delta >= 0 ? (
            <TrendUpIcon size={11} color={colors.success[600]} />
          ) : (
            <TrendDownIcon size={11} color={colors.error[600]} />
          )}
          <Text size="xs" weight="semibold" color={delta >= 0 ? 'success' : 'error'}>
            {`${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`}
          </Text>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  head: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.xs },
  label: { flex: 1 },
  iconChip: {
    width: 28,
    height: 28,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  value: { marginTop: spacing.sm },
  delta: { flexDirection: 'row', alignItems: 'center', gap: 2, marginTop: spacing.xs },
});
