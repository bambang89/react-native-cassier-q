import { useState } from 'react';
import type { ComponentType } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { colors, radii, spacing, staggerDelay } from '@/theme';
import {
  ChevronRightIcon,
  HelpIcon,
  LockIcon,
  LogoutIcon,
  SettingsIcon,
  StoreIcon,
} from '@/components/icons/LineIcons';
import type { LineIconProps } from '@/components/icons/LineIcons';
import { Header } from '@/components/ui/recipes';
import { AlertDialog } from '@/components/ui/overlay';
import { FadeInView, PressableScale } from '@/components/ui/motion';
import { Heading, Text } from '@/components/ui/typography';
import { MENU_CATALOG, useMenuAccess } from '@/navigation/menuCatalog';
import type { MenuKey, MenuTarget } from '@/navigation/menuCatalog';

type MenuAction = MenuTarget | { action: 'help' };

type MenuItem = {
  label: string;
  hint: string;
  icon: ComponentType<LineIconProps>;
  tint: string;
  tintBg: string;
  target: MenuAction;
};

const fromCatalog = (key: MenuKey): MenuItem & { key: MenuKey } => ({ ...MENU_CATALOG[key] });

const SECTION_KEYS: { title: string; keys: MenuKey[] }[] = [
  { title: 'Operasional', keys: ['pesanan', 'inventory', 'customers', 'expenses'] },
  { title: 'Bisnis', keys: ['reports', 'suppliers', 'purchase_orders', 'categories', 'units', 'employees', 'outlet', 'integrations'] },
];

/** Menu sekunder di HP (mockup mobile-menu.html) — pintu ke semua layar di luar bottom tab bar. */
export default function MenuScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const activeStore = useAppSelector((state) => state.access.activeStore);
  const { can, isManager, isSuperadmin } = useMenuAccess();
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const role = user?.roles?.[0];
  const roleLabel = user?.superadmin ? 'Pemilik Aplikasi' : (role?.roleName ?? '-');
  const storeLabel = isSuperadmin ? (activeStore?.name ?? 'Belum memilih toko') : (role?.storeName ?? '-');

  // Menu yang tidak diizinkan Kepala Toko untuk role ini tidak ditampilkan.
  const sections: { title: string; items: MenuItem[] }[] = [
    ...SECTION_KEYS.map((section) => ({
      title: section.title,
      items: section.keys.filter(can).map(fromCatalog),
    })),
    {
      title: 'Akun & Perangkat',
      items: [
        ...(isManager
          ? [{ label: 'Hak Akses Menu', hint: 'Atur menu untuk Produk, Gudang & Kasir', icon: LockIcon, tint: colors.primary[600], tintBg: colors.primary[50], target: { stack: 'MenuAccess' } as MenuAction }]
          : []),
        { label: 'Pengaturan', hint: 'Akun, sesi kasir, kata sandi', icon: SettingsIcon, tint: colors.gray[700], tintBg: colors.gray[100], target: { tab: 'Profile' } as MenuAction },
        ...(can('printer') ? [fromCatalog('printer')] : []),
        { label: 'Bantuan', hint: 'Hubungi dukungan cassier-Q', icon: HelpIcon, tint: colors.gray[700], tintBg: colors.gray[100], target: { action: 'help' } as MenuAction },
      ],
    },
  ].filter((section) => section.items.length > 0);
  const initials = (user?.name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  const open = (target: MenuAction) => {
    if ('tab' in target) {
      navigation.navigate('Main', { screen: target.tab });
    } else if ('stack' in target) {
      navigation.navigate(target.stack as never);
    } else {
      Alert.alert('Bantuan', 'Hubungi admin toko atau dukungan cassier-Q untuk bantuan.');
    }
  };

  const onLogout = async () => {
    setLoggingOut(true);
    try {
      await dispatch(logout());
    } finally {
      setLoggingOut(false);
      setConfirmLogout(false);
    }
  };

  let itemIndex = 0;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header title="Menu" subtitle={`${user?.name ?? '-'} · ${roleLabel}`} showAccount={false} />
      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <FadeInView fromScale={0.97}>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text weight="bold" style={styles.profileInitials}>
                {initials}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Heading level="h5" numberOfLines={1} style={styles.profileName}>
                {user?.name ?? '-'}
              </Heading>
              <Text size="xs" numberOfLines={1} style={styles.profileMeta}>
                {`${roleLabel} · ${storeLabel}`}
              </Text>
            </View>
          </View>
          {isSuperadmin ? (
            <PressableScale style={styles.switchStore} onPress={() => navigation.navigate('StorePicker')}>
              <StoreIcon size={16} color={colors.primary[600]} />
              <Text size="sm" weight="semibold" style={styles.switchStoreLabel}>
                Ganti toko yang dibantu
              </Text>
              <ChevronRightIcon size={16} color={colors.primary[600]} />
            </PressableScale>
          ) : null}
        </FadeInView>

        {sections.map((section) => (
          <View key={section.title} style={styles.section}>
            <Text size="xs" weight="semibold" color="muted" style={styles.sectionTitle}>
              {section.title.toUpperCase()}
            </Text>
            <View style={styles.list}>
              {section.items.map((item, index) => {
                const Icon = item.icon;
                const delay = staggerDelay(itemIndex++, 80);
                return (
                  <FadeInView key={item.label} delay={delay} offsetY={8}>
                    <PressableScale
                      activeScale={0.98}
                      onPress={() => open(item.target)}
                      style={[styles.row, index < section.items.length - 1 && styles.rowDivider]}
                      accessibilityRole="button"
                    >
                      <View style={[styles.rowIcon, { backgroundColor: item.tintBg }]}>
                        <Icon size={18} color={item.tint} />
                      </View>
                      <View style={styles.rowText}>
                        <Text weight="semibold" size="sm">
                          {item.label}
                        </Text>
                        <Text size="xs" color="muted" numberOfLines={1}>
                          {item.hint}
                        </Text>
                      </View>
                      <ChevronRightIcon size={18} color={colors.gray[400]} />
                    </PressableScale>
                  </FadeInView>
                );
              })}
            </View>
          </View>
        ))}

        <FadeInView delay={staggerDelay(itemIndex, 120)}>
          <PressableScale style={styles.logout} onPress={() => setConfirmLogout(true)} accessibilityRole="button">
            <LogoutIcon size={18} color={colors.error[600]} />
            <Text weight="semibold" style={styles.logoutLabel}>
              Keluar
            </Text>
          </PressableScale>
        </FadeInView>
      </ScrollView>

      <AlertDialog
        isOpen={confirmLogout}
        onClose={() => setConfirmLogout(false)}
        title="Keluar dari akun?"
        description="Anda perlu masuk lagi untuk memakai aplikasi di perangkat ini."
        confirmText="Keluar"
        cancelText="Batal"
        isDanger
        isConfirmLoading={loggingOut}
        onConfirm={onLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  body: { padding: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.lg },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radii['2xl'],
    backgroundColor: colors.darkBg,
    overflow: 'hidden',
  },
  profileAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  profileInitials: { color: colors.white, fontSize: 17 },
  switchStore: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  switchStoreLabel: { flex: 1, color: colors.primary[700] },
  profileInfo: { flex: 1 },
  profileName: { color: colors.white },
  profileMeta: { color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  section: { gap: spacing.sm },
  sectionTitle: { letterSpacing: 0.8, marginLeft: spacing.xs },
  list: {
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
  },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  rowIcon: {
    width: 38,
    height: 38,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1, gap: 1 },
  logout: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md + 2,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.error[100],
    backgroundColor: colors.background,
  },
  logoutLabel: { color: colors.error[600] },
});
