import { Fragment, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { getActiveApiEnv, setActiveApiEnv } from '@/api/client';
import { API_ENVIRONMENTS, API_ENV_NAMES } from '@/config/apiEnvironments';
import type { ApiEnvName } from '@/config/apiEnvironments';
import { env } from '@/config/env';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { changePassword, logout, logoutAll, userUpdated } from '@/store/slices/authSlice';
import * as authApi from '@/api/authApi';
import * as storeApi from '@/api/storeApi';
import { apiErrorMessage } from '@/api/errors';
import { choosePhoto } from '@/services/photos/pickPhoto';
import { closeSession, fetchCurrentSession } from '@/store/slices/cashierSessionSlice';
import { fetchStoreProfile, storeProfileUpdated } from '@/store/slices/storeProfileSlice';
import { useResponsive } from '@/hooks/useResponsive';
import { useMenuAccess } from '@/navigation/menuCatalog';
import { CheckoutSettingsForm } from '@/screens/settings/CheckoutSettingsForm';
import { PromoCodeList } from '@/screens/settings/PromoCodeList';
import { BundleList } from '@/screens/settings/BundleList';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import type { CashierSession, User } from '@/types/models';
import { colors, radii, spacing } from '@/theme';
import { tabletColors } from '@/theme/tabletColors';
import { Button, FormControl, Input, Select } from '@/components/ui/forms';
import { Badge, Divider } from '@/components/ui/dataDisplay';
import { AlertDialog, Modal } from '@/components/ui/overlay';
import { Card, Header, SplitItem, TabletSplitView, TabletTopBar } from '@/components/ui/recipes';
import {
  BoxIcon,
  ChevronRightIcon,
  DiscountIcon,
  LockIcon,
  LogoutIcon,
  PencilIcon,
  PrintIcon,
  ReceiptIcon,
  StoreIcon,
  TruckIcon,
  WalletIcon,
  WrenchIcon,
} from '@/components/icons/LineIcons';
import { Text } from '@/components/ui/typography';
import { PressableScale } from '@/components/ui/motion';
import Constants from 'expo-constants';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Profile'>,
  NativeStackScreenProps<RootStackParamList>
>;

// Only settings that have no entry of their own in the sidebar: Outlet (business profile),
// Integrasi, Karyawan and Pelanggan are sidebar menus, so they are not repeated here.
const SETTINGS_SECTIONS = [
  { key: 'akun', label: 'Akun', available: true },
  { key: 'pembayaran', label: 'Pembayaran & PPN', available: true },
  { key: 'promo', label: 'Kode Promo', available: true },
  { key: 'paket', label: 'Paket Bundling', available: true },
  { key: 'pembelian', label: 'Pembelian', available: true },
  { key: 'struk', label: 'Struk & Printer', available: true },
  { key: 'pengguna', label: 'Hak Akses', available: true },
  { key: 'keamanan', label: 'Keamanan', available: true },
  { key: 'notifikasi', label: 'Notifikasi', available: false },
  { key: 'langganan', label: 'Langganan', available: false },
] as const;

type SettingsSectionKey = (typeof SETTINGS_SECTIONS)[number]['key'];

export default function ProfileScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { isTabletLandscape } = useResponsive();
  const user = useAppSelector((state) => state.auth.user);
  const storeProfile = useAppSelector((state) => state.storeProfile.profile);
  const session = useAppSelector((state) => state.cashierSession.current);
  const { isManager } = useMenuAccess();
  const [closeSessionVisible, setCloseSessionVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [logoutConfirmVisible, setLogoutConfirmVisible] = useState(false);
  const [logoutAllConfirmVisible, setLogoutAllConfirmVisible] = useState(false);
  const [selectedSection, setSelectedSection] = useState<SettingsSectionKey>('akun');

  useEffect(() => {
    dispatch(fetchCurrentSession());
    dispatch(fetchStoreProfile());
  }, [dispatch]);

  const primaryRole = user?.roles?.[0] ?? null;
  const storeName = storeProfile?.storeName ?? primaryRole?.storeName ?? '-';
  // Profile & store photos can only be changed by the store head (API: hasRole KEPALA_TOKO).
  const isKepalaToko = !!user?.roles.some((r) => r.roleCode === 'KEPALA_TOKO');
  const [uploading, setUploading] = useState<'avatar' | 'store' | null>(null);

  /** Runs a photo upload/removal and stores the returned user or store profile. */
  const runPhotoAction = async (kind: 'avatar' | 'store', action: () => Promise<void>) => {
    setUploading(kind);
    try {
      await action();
    } catch (error) {
      Alert.alert('Gagal', apiErrorMessage(error, 'Foto tidak bisa disimpan. Pastikan format JPG/PNG/WEBP maks 5MB.'));
    } finally {
      setUploading(null);
    }
  };

  /** Lets the store head pick a new profile photo, or remove the current one. */
  const changeAvatar = () =>
    choosePhoto(
      (file) => runPhotoAction('avatar', async () => {
        dispatch(userUpdated(await authApi.uploadAvatar(file)));
      }),
      {
        title: 'Foto profil',
        onRemove: user?.avatarUrl
          ? () => runPhotoAction('avatar', async () => {
              dispatch(userUpdated(await authApi.removeAvatar()));
            })
          : undefined,
      },
    );

  /** Lets the store head pick a new store photo, or remove the current one. */
  const changeStorePhoto = () =>
    choosePhoto(
      (file) => runPhotoAction('store', async () => {
        dispatch(storeProfileUpdated(await storeApi.uploadStoreLogo(file)));
      }),
      {
        title: 'Foto toko',
        onRemove: storeProfile?.logoUrl
          ? () => runPhotoAction('store', async () => {
              dispatch(storeProfileUpdated(await storeApi.removeStoreLogo()));
            })
          : undefined,
      },
    );

  if (isTabletLandscape) {
    return (
      <SafeAreaView style={[styles.container, styles.containerTablet]} edges={['top', 'left', 'right']}>
        <TabletTopBar
          title="Settings"
          subtitle="Konfigurasi bisnis dan preferensi akun"
          storeName={storeName}
          userName={user?.name ?? 'Kasir'}
        />
        <TabletSplitView
          listWidth={260}
          detailKey={selectedSection}
          detail={
            <SettingsDetailPane
              section={selectedSection}
              navigation={navigation}
              user={user}
              session={session}
              onCloseSession={() => setCloseSessionVisible(true)}
              onChangePassword={() => setChangePasswordVisible(true)}
              onLogout={() => setLogoutConfirmVisible(true)}
              onLogoutAll={() => setLogoutAllConfirmVisible(true)}
            />
          }
        >
          {SETTINGS_SECTIONS.map((section) => (
            <SplitItem
              key={section.key}
              active={selectedSection === section.key}
              onPress={() => setSelectedSection(section.key)}
              title={section.label}
            >
              <Text
                style={[
                  styles.navItemLabel,
                  selectedSection === section.key ? styles.navItemLabelActive : styles.navItemLabelInactive,
                ]}
              >
                {section.label}
              </Text>
            </SplitItem>
          ))}
        </TabletSplitView>

        <Modal isOpen={closeSessionVisible} onClose={() => setCloseSessionVisible(false)}>
          {session ? (
            <CloseSessionForm
              sessionId={session.id}
              onDone={() => setCloseSessionVisible(false)}
              onCancel={() => setCloseSessionVisible(false)}
            />
          ) : null}
        </Modal>
        <Modal isOpen={changePasswordVisible} onClose={() => setChangePasswordVisible(false)}>
          <ChangePasswordForm onDone={() => setChangePasswordVisible(false)} onCancel={() => setChangePasswordVisible(false)} />
        </Modal>
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
        <AlertDialog
          isOpen={logoutAllConfirmVisible}
          onClose={() => setLogoutAllConfirmVisible(false)}
          title="Keluar dari semua perangkat?"
          description="Semua sesi login akun ini — di HP manapun — akan langsung dicabut."
          confirmText="Keluar Semua"
          isDanger
          onConfirm={() => {
            setLogoutAllConfirmVisible(false);
            dispatch(logoutAll());
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header title="Akun" />
      <ScrollView contentContainerStyle={acc.body} showsVerticalScrollIndicator={false}>
        {/* Profil */}
        <View style={acc.hero}>
          <View style={acc.heroGlow} />
          <View style={acc.heroRow}>
            <PressableScale
              activeScale={0.95}
              disabled={!isKepalaToko || uploading !== null}
              onPress={changeAvatar}
              accessibilityRole={isKepalaToko ? 'button' : undefined}
              accessibilityLabel="Ganti foto profil"
            >
              <View style={acc.avatar}>
                {user?.avatarUrl ? (
                  <Image source={{ uri: user.avatarUrl }} style={acc.avatarImage} />
                ) : (
                  <Text weight="bold" style={acc.avatarText}>
                    {initialsOf(user?.name)}
                  </Text>
                )}
                {uploading === 'avatar' ? (
                  <View style={acc.avatarBusy}>
                    <ActivityIndicator color={colors.white} />
                  </View>
                ) : null}
              </View>
              {isKepalaToko ? (
                <View style={acc.editBadge}>
                  <PencilIcon size={11} color={colors.white} />
                </View>
              ) : null}
            </PressableScale>
            <View style={acc.heroInfo}>
              <Text weight="bold" size="lg" numberOfLines={1} style={acc.heroName}>
                {user?.name ?? '-'}
              </Text>
              <Text size="xs" numberOfLines={1} style={acc.heroMuted}>
                @{user?.username ?? '-'}
              </Text>
              {user?.email ? (
                <Text size="xs" numberOfLines={1} style={acc.heroMuted}>
                  {user.email}
                </Text>
              ) : null}
            </View>
          </View>
          <View style={acc.heroFooter}>
            <PressableScale
              activeScale={0.97}
              disabled={!isKepalaToko || uploading !== null}
              onPress={changeStorePhoto}
              style={acc.heroStore}
              accessibilityRole={isKepalaToko ? 'button' : undefined}
              accessibilityLabel="Ganti foto toko"
            >
              <View style={acc.storePhoto}>
                {storeProfile?.logoUrl ? (
                  <Image source={{ uri: storeProfile.logoUrl }} style={acc.storePhotoImage} />
                ) : (
                  <StoreIcon size={16} color="rgba(255,255,255,0.8)" />
                )}
                {uploading === 'store' ? (
                  <View style={acc.avatarBusy}>
                    <ActivityIndicator size="small" color={colors.white} />
                  </View>
                ) : null}
              </View>
              <View style={acc.heroStoreInfo}>
                <Text size="xs" weight="semibold" numberOfLines={1} style={acc.heroStoreText}>
                  {storeName}
                </Text>
                {isKepalaToko ? (
                  <Text size="xs" style={acc.heroHint}>
                    {storeProfile?.logoUrl ? 'Ketuk untuk ganti foto toko' : 'Ketuk untuk tambah foto toko'}
                  </Text>
                ) : null}
              </View>
            </PressableScale>
            <View style={acc.roleRow}>
              {user?.roles.map((role) => (
                <View key={`${role.roleCode}-${role.storeId ?? 'global'}`} style={acc.roleChip}>
                  <Text size="xs" weight="semibold" style={acc.roleChipText}>
                    {role.roleName}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        </View>

        {/* Sesi kasir */}
        <View style={acc.section}>
          <Text size="xs" weight="semibold" color="muted" style={acc.sectionTitle}>
            SESI KASIR
          </Text>
          <View style={acc.sessionCard}>
            <View style={acc.sessionHead}>
              <View style={[acc.statusPill, session ? acc.statusPillOpen : acc.statusPillClosed]}>
                <View style={[acc.statusDot, session ? acc.statusDotOpen : acc.statusDotClosed]} />
                <Text size="xs" weight="semibold" style={session ? acc.statusTextOpen : acc.statusTextClosed}>
                  {session ? 'Sedang dibuka' : 'Belum dibuka'}
                </Text>
              </View>
              <Text size="xs" color="muted">
                Tutup otomatis 23.00
              </Text>
            </View>
            {session ? (
              <Fragment>
                <View style={acc.statRow}>
                  <View style={acc.stat}>
                    <Text size="xs" color="muted">
                      Dibuka
                    </Text>
                    <Text weight="bold">
                      {new Date(session.openedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                  <View style={acc.statDivider} />
                  <View style={acc.stat}>
                    <Text size="xs" color="muted">
                      Durasi
                    </Text>
                    <Text weight="bold">{durationSince(session.openedAt)}</Text>
                  </View>
                  <View style={acc.statDivider} />
                  <View style={acc.stat}>
                    <Text size="xs" color="muted">
                      Modal awal
                    </Text>
                    <Text weight="bold">Rp{session.openingCash.toLocaleString('id-ID')}</Text>
                  </View>
                </View>
                <Button variant="outline" fullWidth onPress={() => setCloseSessionVisible(true)}>
                  Tutup Sesi & Hitung Kas
                </Button>
              </Fragment>
            ) : (
              <Text size="sm" color="secondary" style={acc.sessionEmpty}>
                Buka sesi dari layar Kasir untuk mulai mencatat penjualan hari ini.
              </Text>
            )}
          </View>
        </View>

        {/* Pengaturan toko */}
        {isManager ? (
          <View style={acc.section}>
            <Text size="xs" weight="semibold" color="muted" style={acc.sectionTitle}>
              PENGATURAN TOKO
            </Text>
            <View style={acc.list}>
              <AccountRow
                icon={WalletIcon}
                tint={colors.primary[600]}
                tintBg={colors.primary[50]}
                label="Pembayaran & PPN"
                hint="Metode bayar, default & pajak"
                onPress={() => navigation.navigate('CheckoutSettings')}
              />
              <AccountRow
                icon={DiscountIcon}
                tint={colors.success[600]}
                tintBg={colors.success[50]}
                label="Kode Promo"
                hint="Buat & kelola kode diskon"
                onPress={() => navigation.navigate('PromoCodes')}
              />
              <AccountRow
                icon={BoxIcon}
                tint={colors.warning[600]}
                tintBg={colors.warning[50]}
                label="Paket Bundling"
                hint="Gabung produk, harga khusus"
                onPress={() => navigation.navigate('Bundles')}
                last={!isKepalaToko}
              />
              {isKepalaToko ? (
                <AccountRow
                  icon={LockIcon}
                  tint={colors.teal[700]}
                  tintBg={colors.teal[50]}
                  label="Hak Akses Menu"
                  hint="Menu & aksi untuk Produk, Gudang, Kasir"
                  onPress={() => navigation.navigate('MenuAccess')}
                  last
                />
              ) : null}
            </View>
          </View>
        ) : null}

        {/* Keamanan */}
        <View style={acc.section}>
          <Text size="xs" weight="semibold" color="muted" style={acc.sectionTitle}>
            KEAMANAN
          </Text>
          <View style={acc.list}>
            <AccountRow
              icon={LockIcon}
              tint={colors.warning[600]}
              tintBg={colors.warning[50]}
              label="Ganti Kata Sandi"
              hint="Perbarui kata sandi akun ini"
              onPress={() => setChangePasswordVisible(true)}
            />
            <AccountRow
              icon={LogoutIcon}
              tint={colors.error[600]}
              tintBg={colors.error[50]}
              label="Keluar dari Semua Perangkat"
              hint="Cabut semua sesi login akun ini"
              danger
              onPress={() => setLogoutAllConfirmVisible(true)}
              last
            />
          </View>
        </View>

        {env.appVariant !== 'production' ? (
          <View style={acc.section}>
            <View style={acc.sectionTitleRow}>
              <WrenchIcon size={13} color={colors.text.muted} />
              <Text size="xs" weight="semibold" color="muted" style={acc.sectionTitle}>
                ENVIRONMENT API (DEV)
              </Text>
            </View>
            <Card>
              <EnvSwitcher />
            </Card>
          </View>
        ) : null}

        <Text size="xs" color="muted" align="center" style={acc.version}>
          cassier-Q v{Constants.expoConfig?.version ?? '-'}
        </Text>
      </ScrollView>

      <Modal isOpen={closeSessionVisible} onClose={() => setCloseSessionVisible(false)}>
        {session ? (
          <CloseSessionForm
            sessionId={session.id}
            onDone={() => setCloseSessionVisible(false)}
            onCancel={() => setCloseSessionVisible(false)}
          />
        ) : null}
      </Modal>

      <Modal isOpen={changePasswordVisible} onClose={() => setChangePasswordVisible(false)}>
        <ChangePasswordForm onDone={() => setChangePasswordVisible(false)} onCancel={() => setChangePasswordVisible(false)} />
      </Modal>

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

      <AlertDialog
        isOpen={logoutAllConfirmVisible}
        onClose={() => setLogoutAllConfirmVisible(false)}
        title="Keluar dari semua perangkat?"
        description="Semua sesi login akun ini — di HP manapun — akan langsung dicabut."
        confirmText="Keluar Semua"
        isDanger
        onConfirm={() => {
          setLogoutAllConfirmVisible(false);
          dispatch(logoutAll());
        }}
      />
    </SafeAreaView>
  );
}

/** Up to two initials from a person's name. */
function initialsOf(name?: string | null): string {
  return (
    (name ?? '?')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '?'
  );
}

/** "2 jam 15 mnt" since the given time. */
function durationSince(iso: string): string {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
  const hours = Math.floor(minutes / 60);
  return hours > 0 ? `${hours} jam ${minutes % 60} mnt` : `${minutes} mnt`;
}

/** Settings row in the Akun list: tinted icon, label, hint and chevron. */
function AccountRow({
  icon: Icon,
  tint,
  tintBg,
  label,
  hint,
  onPress,
  danger,
  last,
}: {
  icon: typeof LockIcon;
  tint: string;
  tintBg: string;
  label: string;
  hint: string;
  onPress: () => void;
  danger?: boolean;
  last?: boolean;
}) {
  return (
    <PressableScale
      activeScale={0.98}
      onPress={onPress}
      style={[acc.row, !last && acc.rowDivider]}
      accessibilityRole="button"
    >
      <View style={[acc.rowIcon, { backgroundColor: tintBg }]}>
        <Icon size={18} color={tint} />
      </View>
      <View style={acc.rowText}>
        <Text weight="semibold" size="sm" style={danger ? acc.dangerText : undefined}>
          {label}
        </Text>
        <Text size="xs" color="muted" numberOfLines={1}>
          {hint}
        </Text>
      </View>
      <ChevronRightIcon size={18} color={colors.gray[400]} />
    </PressableScale>
  );
}

const acc = StyleSheet.create({
  body: { padding: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.lg },
  hero: {
    padding: spacing.lg,
    borderRadius: radii['2xl'],
    backgroundColor: colors.darkBg,
    overflow: 'hidden',
    gap: spacing.base,
  },
  heroGlow: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: colors.primary[600],
    opacity: 0.35,
  },
  heroRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.18)',
    overflow: 'hidden',
  },
  avatarText: { color: colors.white, fontSize: 20 },
  avatarImage: { width: '100%', height: '100%' },
  avatarBusy: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(11,31,51,0.55)',
  },
  editBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    borderWidth: 2,
    borderColor: colors.darkBg,
  },
  storePhoto: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  storePhotoImage: { width: '100%', height: '100%' },
  heroStoreInfo: { flexShrink: 1 },
  heroHint: { color: 'rgba(255,255,255,0.5)', fontSize: 10 },
  heroInfo: { flex: 1, gap: 2 },
  heroName: { color: colors.white },
  heroMuted: { color: 'rgba(255,255,255,0.65)' },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  heroStore: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexShrink: 1 },
  heroStoreText: { color: 'rgba(255,255,255,0.85)', flexShrink: 1 },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end' },
  roleChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 9999,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  roleChipText: { color: colors.white },
  section: { gap: spacing.sm },
  sectionTitle: { letterSpacing: 0.8, marginLeft: spacing.xs },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  sessionCard: {
    padding: spacing.base,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  sessionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  statusPillOpen: { backgroundColor: colors.success[50] },
  statusPillClosed: { backgroundColor: colors.gray[100] },
  statusDot: { width: 7, height: 7, borderRadius: 4 },
  statusDotOpen: { backgroundColor: colors.success[500] },
  statusDotClosed: { backgroundColor: colors.gray[400] },
  statusTextOpen: { color: colors.success[700] },
  statusTextClosed: { color: colors.gray[600] },
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    backgroundColor: colors.surface,
  },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, alignSelf: 'stretch', backgroundColor: colors.border },
  sessionEmpty: { lineHeight: 20 },
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
  rowIcon: { width: 38, height: 38, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  rowText: { flex: 1, gap: 1 },
  dangerText: { color: colors.error[600] },
  version: { marginTop: spacing.sm },
});

// Pane kanan split-view Settings — "Profil Bisnis" pakai form outlet asli;
// "Akun"/"Keamanan" pakai konten yang sudah ada di mode HP; sisanya (belum
// ada layarnya di app) tampil "Segera hadir" persis pola EmptyState lain.
function SettingsDetailPane({
  section,
  navigation,
  user,
  session,
  onCloseSession,
  onChangePassword,
  onLogout,
  onLogoutAll,
}: {
  section: SettingsSectionKey;
  navigation: Props['navigation'];
  user: User | null;
  session: CashierSession | null;
  onCloseSession: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  onLogoutAll: () => void;
}) {
  // Shortcuts here follow the same menu-access rules as the sidebar.
  const { can } = useMenuAccess();
  const sectionMeta = SETTINGS_SECTIONS.find((s) => s.key === section)!;

  if (section === 'pengguna') {
    const isSuperadmin = !!user?.superadmin;
    // Hak Akses Menu is for the store head only; Superadmin only switches stores here.
    const isKepalaToko = !!user?.roles.some((r) => r.roleCode === 'KEPALA_TOKO');
    return (
      <ScrollView contentContainerStyle={styles.detailPad}>
        <Text style={styles.detailTitle}>Hak Akses</Text>
        <Text style={styles.detailDesc}>
          {isKepalaToko
            ? 'Tentukan menu dan aksi yang boleh dipakai tiap role. Akun karyawan dikelola di menu Karyawan.'
            : 'Hak akses hanya bisa diatur oleh Kepala Toko.'}
        </Text>
        {isKepalaToko || isSuperadmin ? (
          <Card style={styles.detailCard} padding="none">
            {isKepalaToko ? (
              <Button variant="ghost" style={styles.rowButton} onPress={() => navigation.navigate('MenuAccess')}>
                Hak Akses Menu per Role
              </Button>
            ) : null}
            {isSuperadmin ? (
              <Button variant="ghost" style={styles.rowButton} onPress={() => navigation.navigate('StorePicker')}>
                Ganti Toko yang Dibantu
              </Button>
            ) : null}
          </Card>
        ) : null}
      </ScrollView>
    );
  }

  if (section === 'keamanan') {
    return (
      <ScrollView contentContainerStyle={styles.detailPad}>
        <Text style={styles.detailTitle}>Keamanan</Text>
        <Card style={styles.detailCard} padding="none">
          <Button variant="ghost" style={styles.rowButton} onPress={onChangePassword}>
            Ganti Kata Sandi
          </Button>
        </Card>
        <Button variant="danger" style={styles.logoutButton} onPress={onLogoutAll}>
          Keluar dari Semua Perangkat
        </Button>
      </ScrollView>
    );
  }

  if (section === 'akun') {
    return (
      <ScrollView contentContainerStyle={styles.detailPad}>
        <Text style={styles.detailTitle}>Akun</Text>
        <Card style={styles.detailCard}>
          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <Text weight="bold" size="xl" color="inverse">
                {(user?.name ?? '?').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.identityInfo}>
              <Text weight="bold" size="lg">
                {user?.name ?? '-'}
              </Text>
              <Text color="secondary" size="sm">
                {[user?.email, `@${user?.username ?? '-'}`].filter(Boolean).join(' · ')}
              </Text>
            </View>
          </View>
          <View style={styles.roles}>
            {user?.roles.map((role) => (
              <Badge key={`${role.roleCode}-${role.storeId ?? 'global'}`} variant="primary">
                {role.roleName}
              </Badge>
            ))}
          </View>
        </Card>

        <Card style={styles.detailCard}>
          {session ? (
            <Fragment>
              <View style={styles.sessionOpenRow}>
                <Badge variant="success">Sedang Buka</Badge>
                <Text size="sm" color="secondary">
                  Sejak {new Date(session.openedAt).toLocaleString('id-ID')}
                </Text>
              </View>
              <Text size="sm" color="secondary" style={styles.sessionCash}>
                Modal awal: Rp {session.openingCash.toLocaleString('id-ID')}
              </Text>
              <Button variant="outline" size="sm" style={styles.closeSessionButton} onPress={onCloseSession}>
                Tutup Sesi
              </Button>
            </Fragment>
          ) : (
            <Text color="muted" size="sm">
              Belum ada sesi kasir yang dibuka hari ini.
            </Text>
          )}
        </Card>

        <Button variant="danger" style={styles.logoutButton} onPress={onLogout}>
          Keluar
        </Button>
      </ScrollView>
    );
  }

  if (section === 'pembelian') {
    return (
      <ScrollView contentContainerStyle={styles.detailPad}>
        <Text style={styles.detailTitle}>Pembelian</Text>
        <Text style={styles.detailDesc}>Pemasok dan pembelian stok ke supplier.</Text>
        {can('suppliers') || can('purchase_orders') ? (
          <Card style={styles.detailCard} padding="none">
            {can('suppliers') ? (
              <Button
                variant="ghost"
                style={styles.rowButton}
                leftIcon={<TruckIcon size={16} color={colors.text.secondary} />}
                onPress={() => navigation.navigate('Suppliers')}
              >
                Pemasok
              </Button>
            ) : null}
            {can('suppliers') && can('purchase_orders') ? <Divider /> : null}
            {can('purchase_orders') ? (
              <Button
                variant="ghost"
                style={styles.rowButton}
                leftIcon={<ReceiptIcon size={16} color={colors.text.secondary} />}
                onPress={() => navigation.navigate('PurchaseOrders')}
              >
                Purchase Order
              </Button>
            ) : null}
          </Card>
        ) : (
          <Text color="muted" size="sm">
            Menu pembelian tidak tersedia untuk role Anda.
          </Text>
        )}
      </ScrollView>
    );
  }

  if (section === 'pembayaran') {
    return (
      <View style={styles.detailFlex}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>Pembayaran & PPN</Text>
          <Text style={styles.detailDesc}>Metode pembayaran yang diterima toko, metode default, dan PPN.</Text>
        </View>
        <CheckoutSettingsForm />
      </View>
    );
  }

  if (section === 'paket') {
    return (
      <View style={styles.detailFlex}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>Paket Bundling</Text>
          <Text style={styles.detailDesc}>Gabungkan beberapa produk jadi satu paket dengan harga khusus. Khusus Kepala Toko.</Text>
        </View>
        <BundleList />
      </View>
    );
  }

  if (section === 'promo') {
    return (
      <View style={styles.detailFlex}>
        <View style={styles.detailHeader}>
          <Text style={styles.detailTitle}>Kode Promo</Text>
          <Text style={styles.detailDesc}>Buat kode promo yang bisa dimasukkan kasir saat pembayaran.</Text>
        </View>
        <PromoCodeList />
      </View>
    );
  }

  if (section === 'struk') {
    return (
      <ScrollView contentContainerStyle={styles.detailPad}>
        <Text style={styles.detailTitle}>Struk & Printer</Text>
        <Text style={styles.detailDesc}>Printer Bluetooth dan ukuran kertas struk.</Text>
        <Card style={styles.detailCard} padding="none">
          <Button
            variant="ghost"
            style={styles.rowButton}
            leftIcon={<PrintIcon size={16} color={colors.text.secondary} />}
            onPress={() => navigation.navigate('PrinterSettings')}
          >
            Pilih Printer & Ukuran Kertas
          </Button>
        </Card>
      </ScrollView>
    );
  }

  return (
    <View style={styles.detailPad}>
      <Text style={styles.detailTitle}>{sectionMeta.label}</Text>
      <View style={styles.comingSoonBox}>
        <Text color="muted" align="center">
          Segera hadir.
        </Text>
      </View>
    </View>
  );
}

function CloseSessionForm({
  sessionId,
  onDone,
  onCancel,
}: {
  sessionId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const dispatch = useAppDispatch();
  const [actualCash, setActualCash] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const parsed = Number(actualCash);
    if (Number.isNaN(parsed) || parsed < 0) return;
    setSubmitting(true);
    try {
      await dispatch(closeSession({ id: sessionId, actualCash: parsed, notes: notes || undefined })).unwrap();
      onDone();
    } catch {
      Alert.alert('Gagal', 'Sesi kasir tidak bisa ditutup.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text weight="semibold" size="lg" style={styles.modalTitle}>
        Tutup Sesi Kasir
      </Text>
      <FormControl label="Kas fisik yang dihitung" isRequired>
        <Input keyboardType="numeric" value={actualCash} onChangeText={setActualCash} placeholder="0" />
      </FormControl>
      <FormControl label="Catatan (opsional)">
        <Input value={notes} onChangeText={setNotes} placeholder="mis. selisih karena kembalian" />
      </FormControl>
      <View style={styles.modalActions}>
        <Button variant="ghost" onPress={onCancel} style={styles.modalAction}>
          Batal
        </Button>
        <Button onPress={onSubmit} loading={submitting} disabled={!actualCash} style={styles.modalAction}>
          Tutup
        </Button>
      </View>
    </View>
  );
}

function ChangePasswordForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const dispatch = useAppDispatch();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await dispatch(changePassword({ currentPassword, newPassword })).unwrap();
      Alert.alert('Berhasil', 'Kata sandi sudah diganti.');
      onDone();
    } catch {
      Alert.alert('Gagal', 'Kata sandi saat ini salah, atau kata sandi baru tidak memenuhi syarat.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text weight="semibold" size="lg" style={styles.modalTitle}>
        Ganti Kata Sandi
      </Text>
      <FormControl label="Kata sandi saat ini" isRequired>
        <Input secureTextEntry value={currentPassword} onChangeText={setCurrentPassword} />
      </FormControl>
      <FormControl label="Kata sandi baru" isRequired helperText="Minimal 8 karakter">
        <Input secureTextEntry value={newPassword} onChangeText={setNewPassword} />
      </FormControl>
      <View style={styles.modalActions}>
        <Button variant="ghost" onPress={onCancel} style={styles.modalAction}>
          Batal
        </Button>
        <Button
          onPress={onSubmit}
          loading={submitting}
          disabled={!currentPassword || newPassword.length < 8}
          style={styles.modalAction}
        >
          Simpan
        </Button>
      </View>
    </View>
  );
}

function EnvSwitcher() {
  const [current, setCurrent] = useState<ApiEnvName>(getActiveApiEnv());
  const [switching, setSwitching] = useState(false);

  const onChange = async (next: ApiEnvName) => {
    setSwitching(true);
    try {
      await setActiveApiEnv(next);
      setCurrent(next);
      Alert.alert('Environment diganti', `Sekarang memakai ${API_ENVIRONMENTS[next].label}. Silakan masuk lagi.`);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <View>
      <Text size="xs" color="muted" style={styles.envHint}>
        Ganti backend yang dipakai app tanpa build ulang. Sesi login akan direset.
      </Text>
      <Select
        value={current}
        onChange={onChange}
        isDisabled={switching}
        options={API_ENV_NAMES.map((name) => ({ label: API_ENVIRONMENTS[name].label, value: name }))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  body: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityInfo: { flex: 1 },
  roles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  sessionOpenRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sessionCash: { marginTop: spacing.sm },
  closeSessionButton: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  rowButton: { alignItems: 'flex-start', paddingHorizontal: spacing.base, paddingVertical: spacing.md },
  logoutButton: { marginTop: spacing['2xl'] },
  logoutAllButton: { marginTop: spacing.sm },
  modalTitle: { marginBottom: spacing.base },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { minWidth: 90 },
  envHint: { marginBottom: spacing.sm },

  // Mode tablet — split-view Settings, persis tablet-settings.html.
  containerTablet: { backgroundColor: tabletColors.gray25 },
  navItemLabel: { fontSize: 13 },
  navItemLabelActive: { fontWeight: '700', color: tabletColors.blue600 },
  navItemLabelInactive: { fontWeight: '500', color: tabletColors.gray700 },
  detailPad: { padding: 26 },
  detailFlex: { flex: 1, maxWidth: 720 },
  detailHeader: { paddingHorizontal: 26, paddingTop: 26 },
  detailTitle: { fontSize: 20, fontWeight: '700', color: tabletColors.gray900, marginBottom: 4 },
  detailDesc: { fontSize: 12.5, color: tabletColors.gray500, marginBottom: 16 },
  detailCard: { maxWidth: 640, marginBottom: 16 },
  comingSoonBox: {
    marginTop: spacing.lg,
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
