import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { colors, radii, spacing } from '@/theme';
import { Pressable } from '@/components/ui/forms/Pressable';
import { Text } from '@/components/ui/typography/Text';

export interface AppBarProps {
  title: string;
  onBack?: () => void;
  rightElement?: ReactNode;
  leftElement?: ReactNode;
}

export function AppBar({ title, onBack, rightElement, leftElement }: AppBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={8}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
          >
            <Text size="2xl" weight="bold" style={styles.backGlyph}>
              ‹
            </Text>
          </Pressable>
        ) : (
          leftElement
        )}
      </View>

      <Text size="xl" weight="bold" numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      <View style={[styles.side, styles.sideRight]}>{rightElement}</View>
    </View>
  );
}

const SIDE_WIDTH = 48;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  side: { minWidth: SIDE_WIDTH, justifyContent: 'center' },
  sideRight: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center' },
  backButton: {
    width: SIDE_WIDTH,
    height: SIDE_WIDTH,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
  },
  backGlyph: { marginRight: 2 },
});
