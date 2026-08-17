import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';

import { radii, spacing } from '@/theme';
import { Card } from './Card';
import { Heading, Text } from '@/components/ui/typography';

export interface StatCardProps {
  icon: string;
  iconBg: string;
  label: string;
  value: string;
  style?: StyleProp<ViewStyle>;
}

export function StatCard({ icon, iconBg, label, value, style }: StatCardProps) {
  return (
    <Card style={[styles.card, style]}>
      <View style={[styles.iconCircle, { backgroundColor: iconBg }]}>
        <Text size="lg">{icon}</Text>
      </View>
      <Text size="sm" color="secondary" weight="medium" style={styles.label}>
        {label}
      </Text>
      <Heading level="h4" style={styles.value}>
        {value}
      </Heading>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1 },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: { marginBottom: 2 },
  value: {},
});
