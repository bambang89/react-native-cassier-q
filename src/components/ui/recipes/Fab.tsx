import { StyleSheet } from 'react-native';
import type { ComponentType } from 'react';

import { colors, radii, shadows, spacing } from '@/theme';
import type { LineIconProps } from '@/components/icons/LineIcons';
import { FadeInView, PressableScale } from '@/components/ui/motion';

export interface FabProps {
  icon: ComponentType<LineIconProps>;
  onPress: () => void;
  accessibilityLabel: string;
}

/** Tombol aksi melayang (kanan-bawah) untuk aksi utama layar di HP, mis. tambah produk. */
export function Fab({ icon: Icon, onPress, accessibilityLabel }: FabProps) {
  return (
    <FadeInView delay={250} offsetY={24} fromScale={0.6} style={styles.wrap}>
      <PressableScale
        activeScale={0.9}
        onPress={onPress}
        style={styles.fab}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
      >
        <Icon size={24} color={colors.white} strokeWidth={2.2} />
      </PressableScale>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', right: spacing.lg, bottom: spacing.lg },
  fab: {
    width: 56,
    height: 56,
    borderRadius: radii.xl + 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    ...shadows.float,
    shadowColor: colors.primary[600],
  },
});
