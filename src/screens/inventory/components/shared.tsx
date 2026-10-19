import type { ComponentType, ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';
import { Pressable } from '@/components/ui/forms';
import { Text } from '@/components/ui/typography';
import type { LineIconProps } from '@/components/icons/LineIcons';

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
    // flexGrow 0: ScrollView horizontal tidak boleh ikut mengisi tinggi layar (chip jadi melar).
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chips}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable key={option.value} onPress={() => onChange(option.value)} style={[styles.chip, active && styles.chipActive]}>
            <Text size="xs" weight="semibold" style={active ? styles.chipTextActive : styles.chipText}>
              {option.label}
            </Text>
            {option.count !== undefined ? (
              <View style={[styles.chipCount, active && styles.chipCountActive]}>
                <Text size="xs" weight="bold" style={active ? styles.chipTextActive : styles.chipText}>
                  {option.count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const TILE_TONES = {
  neutral: { fg: colors.text.primary, bg: colors.background, chip: colors.gray[100], chipFg: colors.gray[600], border: colors.border },
  error: { fg: colors.error[600], bg: colors.error[50], chip: colors.error[100], chipFg: colors.error[600], border: colors.error[100] },
  warning: { fg: colors.warning[700], bg: colors.warning[50], chip: colors.warning[100], chipFg: colors.warning[700], border: colors.warning[100] },
  success: { fg: colors.success[700], bg: colors.success[50], chip: colors.success[100], chipFg: colors.success[700], border: colors.success[100] },
} as const;

/**
 * Summary tile: big number, small label, tinted by tone. Tappable (e.g. to filter)
 * when onPress is given; `active` outlines it. No adjustsFontSizeToFit — on iOS it
 * shrinks the number to an unreadable size inside a flex row.
 */
export function StatTile({
  label,
  value,
  tone = 'neutral',
  icon: Icon,
  onPress,
  active,
  large,
}: {
  label: string;
  value: string;
  tone?: keyof typeof TILE_TONES;
  icon?: ComponentType<LineIconProps>;
  onPress?: () => void;
  active?: boolean;
  /** Full-width tile with a slightly smaller number (e.g. a Rupiah amount). */
  large?: boolean;
}) {
  const t = TILE_TONES[tone];
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={[
        styles.tile,
        { backgroundColor: t.bg, borderColor: active ? t.fg : t.border },
        active && styles.tileActive,
      ]}
      accessibilityRole={onPress ? 'button' : undefined}
      accessibilityState={onPress ? { selected: !!active } : undefined}
    >
      <View style={styles.tileHead}>
        <Text size="xs" weight="semibold" style={{ color: tone === 'neutral' ? colors.text.secondary : t.fg }} numberOfLines={1}>
          {label}
        </Text>
        {Icon ? (
          <View style={[styles.tileIcon, { backgroundColor: t.chip }]}>
            <Icon size={14} color={t.chipFg} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.tileValue, large && styles.tileValueLarge, { color: t.fg }]} numberOfLines={1}>
        {value}
      </Text>
    </Pressable>
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
  chipScroll: { flexGrow: 0, flexShrink: 0 },
  chips: { gap: spacing.sm, paddingHorizontal: spacing.base, paddingVertical: spacing.sm, alignItems: 'center' },
  chipCount: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 6,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
  },
  chipCountActive: { backgroundColor: 'rgba(255,255,255,0.18)' },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 36,
    paddingHorizontal: 14,
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
    minHeight: 84,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  tileActive: { borderWidth: 1.5 },
  tileHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.xs },
  tileIcon: { width: 26, height: 26, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },
  tileValue: { fontSize: 26, lineHeight: 32, fontWeight: '800' },
  tileValueLarge: { fontSize: 22, lineHeight: 28 },
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
