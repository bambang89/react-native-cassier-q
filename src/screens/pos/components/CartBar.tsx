import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { colors, motion, radii, shadows, spacing } from '@/theme';
import { CartIcon, ChevronRightIcon } from '@/components/icons/LineIcons';
import { PressableScale } from '@/components/ui/motion';
import { Text } from '@/components/ui/typography';
import { formatRupiah } from '../POSScreen.utils';

/**
 * Ringkasan keranjang melayang di atas tab bar (mode HP). Naik dengan spring
 * saat item pertama masuk, dan "berdenyut" setiap jumlah item bertambah —
 * umpan balik bahwa tap di kartu produk berhasil.
 */
export function CartBar({ count, total, onPress }: { count: number; total: number; onPress: () => void }) {
  const enter = useRef(new Animated.Value(0)).current;
  const bump = useRef(new Animated.Value(1)).current;
  const previousCount = useRef(count);

  useEffect(() => {
    Animated.spring(enter, { toValue: 1, useNativeDriver: true, ...motion.spring.gentle }).start();
  }, [enter]);

  useEffect(() => {
    if (count > previousCount.current) {
      Animated.sequence([
        Animated.timing(bump, { toValue: 1.18, duration: 110, useNativeDriver: true }),
        Animated.spring(bump, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 12 }),
      ]).start();
    }
    previousCount.current = count;
  }, [count, bump]);

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          opacity: enter,
          transform: [{ translateY: enter.interpolate({ inputRange: [0, 1], outputRange: [80, 0] }) }],
        },
      ]}
    >
      <PressableScale activeScale={0.98} onPress={onPress} style={styles.bar} accessibilityRole="button">
        <Animated.View style={[styles.badge, { transform: [{ scale: bump }] }]}>
          <CartIcon size={18} color={colors.white} />
          <View style={styles.count}>
            <Text size="xs" weight="bold" style={styles.countLabel}>
              {count}
            </Text>
          </View>
        </Animated.View>
        <View style={styles.info}>
          <Text size="xs" style={styles.caption}>
            {`${count} item · Total`}
          </Text>
          <Text weight="bold" size="lg" style={styles.total} numberOfLines={1}>
            {formatRupiah(total)}
          </Text>
        </View>
        <View style={styles.cta}>
          <Text weight="bold" size="sm" style={styles.ctaLabel}>
            Bayar
          </Text>
          <ChevronRightIcon size={16} color={colors.white} strokeWidth={2.2} />
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: spacing.base, right: spacing.base, bottom: spacing.md },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.sm,
    paddingLeft: spacing.md,
    borderRadius: radii['2xl'],
    backgroundColor: colors.darkBg,
    ...shadows.float,
  },
  badge: {
    width: 42,
    height: 42,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  count: {
    position: 'absolute',
    top: -6,
    right: -6,
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    backgroundColor: colors.success[500],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.darkBg,
  },
  countLabel: { color: colors.white, fontSize: 10.5 },
  info: { flex: 1 },
  caption: { color: 'rgba(255,255,255,0.65)' },
  total: { color: colors.white },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.primary[600],
  },
  ctaLabel: { color: colors.white },
});
