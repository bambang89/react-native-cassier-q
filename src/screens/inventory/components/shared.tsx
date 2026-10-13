import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';
import { Pressable } from '@/components/ui/forms';
import { Text } from '@/components/ui/typography';

/** Horizontal filter chips with an optional count. */
export function FilterChips<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string; count?: number }[];
  value: T;
  onChange: (value: T) => void;
}) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.chip, active && styles.chipActive]}>
            <Text size="xs" weight="semibold" style={active ? styles.chipTextActive : styles.chipText}>
              {option.label}
              {option.count !== undefined ? ` · ${option.count}` : ''}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Small stat tile used in the summary rows. */
export function StatTile({ label, value, tone }: { label: string; value: string; tone?: 'error' | 'warning' | 'success' }) {
  const color = tone === 'error' ? colors.error[600] : tone === 'warning' ? colors.warning[700] : tone === 'success' ? colors.success[700] : colors.text.primary;
  return (
    <View style={styles.tile}>
      <Text size="xs" color="muted" numberOfLines={1}>
        {label}
      </Text>
      <Text weight="bold" style={{ color }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}

/** Dark summary card with a title and children. */
export function HeroCard({ title, value, children }: { title: string; value: string; children?: ReactNode }) {
  return (
    <View style={styles.hero}>
      <Text size="xs" weight="semibold" style={styles.heroLabel}>
        {title}
      </Text>
      <Text style={styles.heroValue}>{value}</Text>
      {children}
    </View>
  );
}

export const styles = StyleSheet.create({
  chips: { gap: spacing.sm, paddingHorizontal: spacing.base, paddingVertical: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.darkBg, borderColor: colors.darkBg },
  chipText: { color: colors.text.secondary },
  chipTextActive: { color: colors.white },
  tile: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: 2,
  },
  hero: { padding: spacing.lg, borderRadius: radii.xl, backgroundColor: colors.darkBg, gap: 2 },
  heroLabel: { color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  heroValue: { color: colors.white, fontSize: 26, lineHeight: 32, fontWeight: '800' },
  card: {
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  flex: { flex: 1 },
  list: { padding: spacing.base, paddingBottom: spacing['3xl'], gap: spacing.sm },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.base,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: 15, color: colors.text.primary },
});
