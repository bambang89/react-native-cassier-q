import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { colors, radii, spacing } from '@/theme';
import { PressableScale } from '@/components/ui/motion/PressableScale';
import { ChevronLeftIcon } from '@/components/icons/LineIcons';
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
          <PressableScale
            onPress={onBack}
            hitSlop={8}
            activeScale={0.9}
            style={styles.backButton}
            accessibilityRole="button"
            accessibilityLabel="Kembali"
          >
            <ChevronLeftIcon size={20} color={colors.gray[700]} />
          </PressableScale>
        ) : (
          leftElement
        )}
      </View>

      <Text size="lg" weight="bold" numberOfLines={1} style={styles.title}>
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
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  side: { minWidth: SIDE_WIDTH, justifyContent: 'center' },
  sideRight: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center' },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.border,
  },
});
