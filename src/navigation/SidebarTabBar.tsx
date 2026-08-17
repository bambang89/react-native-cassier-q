import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useAppDispatch } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { colors, radii, spacing } from '@/theme';
import { Pressable, Switch } from '@/components/ui/forms';
import { AlertDialog } from '@/components/ui/overlay';
import { Text } from '@/components/ui/typography';
import type { MainTabParamList } from './types';

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  POS: '🛒',
  Products: '📦',
  Orders: '🕘',
  Reports: '📊',
  Expenses: '💸',
  Profile: '⚙️',
};

const COLLAPSED_WIDTH = 76;
const EXPANDED_WIDTH = 240;

// Sidebar khusus mode tablet-landscape, dibuat lewat prop `tabBar` supaya bisa
// menaruh header brand + tombol Keluar/Mode Tampilan yang bukan bagian dari
// route navigasi biasa. Di HP, navigator tetap pakai bottom tab bar bawaan.
export default function SidebarTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const dispatch = useAppDispatch();
  const [collapsed, setCollapsed] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);

  return (
    <SafeAreaView
      edges={['top', 'left', 'bottom']}
      style={[styles.container, { width: collapsed ? COLLAPSED_WIDTH : EXPANDED_WIDTH }]}
    >
      <View style={styles.brandRow}>
        <View style={styles.brandIcon}>
          <Text size="lg">🛒</Text>
        </View>
        {!collapsed ? (
          <View style={styles.brandText}>
            <Text weight="bold" numberOfLines={1}>
              Pos System
            </Text>
            <Text size="xs" color="muted" numberOfLines={1}>
              Sistem kasir
            </Text>
          </View>
        ) : null}
        <Pressable
          style={styles.collapseButton}
          onPress={() => setCollapsed((prev) => !prev)}
          accessibilityLabel={collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'}
        >
          <Text size="sm">{collapsed ? '»' : '«'}</Text>
        </Pressable>
      </View>

      <View style={styles.menuList}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label = (options.title ?? route.name) as string;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={[styles.menuItem, isFocused && styles.menuItemActive]}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
            >
              <Text size="lg">{TAB_ICONS[route.name as keyof MainTabParamList]}</Text>
              {!collapsed ? (
                <Text
                  size="sm"
                  weight="semibold"
                  color={isFocused ? 'link' : 'secondary'}
                  numberOfLines={1}
                  style={styles.menuLabel}
                >
                  {label}
                </Text>
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.bottomSection}>
        <View style={styles.divider} />
        <View style={styles.modeRow}>
          <Text size="lg">🌙</Text>
          {!collapsed ? (
            <Text size="sm" weight="semibold" color="secondary" style={styles.menuLabel}>
              Mode Tampilan
            </Text>
          ) : null}
          <Switch value={darkMode} onValueChange={setDarkMode} />
        </View>
        <Pressable style={styles.logoutRow} onPress={() => setLogoutConfirmVisible(true)}>
          <Text size="lg">🚪</Text>
          {!collapsed ? (
            <Text size="sm" weight="semibold" color="danger" style={styles.menuLabel}>
              Keluar
            </Text>
          ) : null}
        </Pressable>
      </View>

      <AlertDialog
        isOpen={logoutConfirmVisible}
        onClose={() => setLogoutConfirmVisible(false)}
        title="Keluar dari akun?"
        confirmText="Keluar"
        isDanger
        onConfirm={() => {
          setLogoutConfirmVisible(false);
          dispatch(logout());
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    backgroundColor: colors.background,
    paddingVertical: spacing.base,
    paddingHorizontal: spacing.sm,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: { flex: 1 },
  collapseButton: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuList: { flex: 1, gap: spacing.xs },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
  menuItemActive: { backgroundColor: colors.primary[50] },
  menuLabel: { flex: 1 },
  bottomSection: { marginTop: spacing.sm },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginBottom: spacing.sm },
  modeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
  },
  logoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
  },
});
