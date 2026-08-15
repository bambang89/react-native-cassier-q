import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { colors, fontSizes, spacing } from '../../../theme';
import { Pressable } from '../forms/Pressable';
import { Text } from '../typography/Text';

export interface AppBarProps {
  title: string;
  onBack?: () => void;
  rightElement?: ReactNode;
  /** Aksi tambahan di kiri, dipakai kalau tidak butuh tombol back (mis. ikon menu drawer). */
  leftElement?: ReactNode;
}

// Bar navigasi atas: judul di tengah, tombol back opsional di kiri, slot aksi
// di kanan (mis. ikon scan/notifikasi). Sudah aware terhadap safe-area atas.
export function AppBar({ title, onBack, rightElement, leftElement }: AppBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + spacing.sm }]}>
      <View style={styles.side}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button" accessibilityLabel="Kembali">
            <Text size="xl">‹</Text>
          </Pressable>
        ) : (
          leftElement
        )}
      </View>

      <Text size="lg" weight="semibold" numberOfLines={1} style={styles.title}>
        {title}
      </Text>

      <View style={[styles.side, styles.sideRight]}>{rightElement}</View>
    </View>
  );
}

const SIDE_WIDTH = 44;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  side: { minWidth: SIDE_WIDTH, justifyContent: 'center' },
  sideRight: { alignItems: 'flex-end' },
  title: { flex: 1, textAlign: 'center', fontSize: fontSizes.lg },
});
