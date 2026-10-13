import { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import type { LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { colors, fontFamilies, motion, radii, shadows, spacing } from '@/theme';
import { CartIcon, DashboardIcon, BoxIcon, MoreIcon, ReceiptIcon } from '@/components/icons/LineIcons';
import type { LineIconProps } from '@/components/icons/LineIcons';
import { PressableScale } from '@/components/ui/motion/PressableScale';
import { isPhoneTabBarRoute, PHONE_TAB_LABELS } from './phoneTabs';
import type { PhoneTabBarRoute } from './phoneTabs';
import { useMenuAccess } from './menuCatalog';
import type { ComponentType } from 'react';

const ICONS: Record<PhoneTabBarRoute, ComponentType<LineIconProps>> = {
  Dashboard: DashboardIcon,
  Orders: ReceiptIcon,
  POS: CartIcon,
  Products: BoxIcon,
  Menu: MoreIcon,
};

const INDICATOR_WIDTH = 22;

type Slot = PhoneTabBarRoute | 'spacer';

/**
 * Susun slot tab bar dari menu yang diizinkan. Kasir tetap di tengah: kalau
 * jumlah item kiri & kanan tidak sama (karena ada menu disembunyikan), sisi
 * yang lebih sedikit diberi slot kosong di sebelah Kasir — supaya Beranda
 * tetap di ujung kiri dan Menu tetap di ujung kanan seperti biasa.
 */
function buildSlots(canShow: (route: PhoneTabBarRoute) => boolean): Slot[] {
  const left = (['Dashboard', 'Orders'] as const).filter(canShow);
  const right = (['Products', 'Menu'] as const).filter(canShow);
  if (!canShow('POS')) return [...left, ...right];
  const pad = (n: number): Slot[] => Array.from({ length: n }, () => 'spacer' as const);
  const diff = left.length - right.length;
  return [...left, ...pad(Math.max(0, -diff)), 'POS', ...pad(Math.max(0, diff)), ...right];
}

/**
 * Bottom tab bar HP sesuai mockup mobile-*.html: Beranda · Transaksi ·
 * Kasir (tombol utama menonjol) · Produk · Menu. Layar yang dibuka dari
 * Menu (Pelanggan, Karyawan, ...) tetap menyorot "Menu".
 */
export default function PhoneTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const { canTab } = useMenuAccess();
  const [barWidth, setBarWidth] = useState(0);
  const slots = buildSlots((route) => route === 'Menu' || canTab(route));
  const focusedName = state.routes[state.index]?.name ?? 'Dashboard';
  const activeRoute: PhoneTabBarRoute = isPhoneTabBarRoute(focusedName) ? focusedName : 'Menu';
  const activeIndex = slots.indexOf(activeRoute);
  const centerIndex = slots.indexOf('POS');

  const indicatorX = useRef(new Animated.Value(0)).current;
  const indicatorOpacity = useRef(new Animated.Value(0)).current;
  const slotWidth = barWidth / Math.max(slots.length, 1);

  useEffect(() => {
    if (!barWidth) return;
    Animated.parallel([
      Animated.spring(indicatorX, {
        toValue: activeIndex * slotWidth + (slotWidth - INDICATOR_WIDTH) / 2,
        useNativeDriver: true,
        ...motion.spring.gentle,
      }),
      // Kasir punya tombol bulat sendiri sebagai penanda aktif.
      Animated.timing(indicatorOpacity, {
        toValue: activeIndex < 0 || activeIndex === centerIndex ? 0 : 1,
        duration: motion.duration.fast,
        useNativeDriver: true,
      }),
    ]).start();
  }, [activeIndex, centerIndex, barWidth, slotWidth, indicatorX, indicatorOpacity]);

  const onPress = (name: PhoneTabBarRoute) => {
    const route = state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (focusedName !== name && !event.defaultPrevented) {
      navigation.navigate(name);
    }
  };

  return (
    <View
      style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}
      onLayout={(e: LayoutChangeEvent) => setBarWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[styles.indicator, { opacity: indicatorOpacity, transform: [{ translateX: indicatorX }] }]}
      />
      {slots.map((name, index) =>
        name === 'spacer' ? (
          <View key={`spacer-${index}`} style={styles.slot} />
        ) : name === 'POS' ? (
          <View key={name} style={styles.slot}>
            <PressableScale
              activeScale={0.9}
              onPress={() => onPress(name)}
              style={[styles.fab, activeRoute === name && styles.fabActive]}
              accessibilityRole="button"
              accessibilityLabel={PHONE_TAB_LABELS[name]}
              accessibilityState={{ selected: activeRoute === name }}
            >
              <CartIcon size={24} color={colors.white} strokeWidth={2} />
            </PressableScale>
          </View>
        ) : (
          <TabItem
            key={name}
            name={name}
            focused={activeRoute === name}
            onPress={() => onPress(name)}
          />
        ),
      )}
    </View>
  );
}

function TabItem({ name, focused, onPress }: { name: PhoneTabBarRoute; focused: boolean; onPress: () => void }) {
  const progress = useRef(new Animated.Value(focused ? 1 : 0)).current;

  useEffect(() => {
    Animated.spring(progress, { toValue: focused ? 1 : 0, useNativeDriver: true, ...motion.spring.gentle }).start();
  }, [focused, progress]);

  const Icon = ICONS[name];
  const color = focused ? colors.primary[600] : colors.gray[400];

  return (
    <PressableScale
      activeScale={0.9}
      onPress={onPress}
      style={styles.slot}
      accessibilityRole="button"
      accessibilityLabel={PHONE_TAB_LABELS[name]}
      accessibilityState={{ selected: focused }}
    >
      <Animated.View
        style={{
          transform: [
            { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] }) },
            { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [0, -1] }) },
          ],
        }}
      >
        <Icon size={21} color={color} strokeWidth={focused ? 2 : 1.7} />
      </Animated.View>
      <Animated.Text
        style={[
          styles.label,
          { color, fontFamily: focused ? fontFamilies.semibold : fontFamilies.medium },
        ]}
        numberOfLines={1}
      >
        {PHONE_TAB_LABELS[name]}
      </Animated.Text>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  indicator: {
    position: 'absolute',
    top: -1,
    left: 0,
    width: INDICATOR_WIDTH,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    backgroundColor: colors.primary[600],
  },
  slot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 3,
    minHeight: 46,
  },
  label: { fontSize: 11 },
  fab: {
    width: 56,
    height: 56,
    marginTop: -30,
    marginBottom: 4,
    borderRadius: radii.xl + 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    borderWidth: 4,
    borderColor: colors.background,
    ...shadows.float,
    shadowColor: colors.primary[600],
  },
  fabActive: { backgroundColor: colors.primary[700] },
});
