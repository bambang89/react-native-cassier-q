import { Fragment, useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchMenuAccess, saveMenuAccess } from '@/store/slices/accessSlice';
import { colors, radii, spacing, staggerDelay } from '@/theme';
import { CheckIcon, LockIcon } from '@/components/icons/LineIcons';
import { Button, Switch } from '@/components/ui/forms';
import { AppBar, EmptyState } from '@/components/ui/recipes';
import { FadeInView, PressableScale } from '@/components/ui/motion';
import { Text } from '@/components/ui/typography';
import { MENU_CATALOG, MENU_KEYS } from '@/navigation/menuCatalog';
import type { MenuKey } from '@/navigation/menuCatalog';

const ROLES = [
  { code: 'PRODUCT', label: 'Produk', hint: 'Admin produk — mengelola katalog, harga & stok' },
  { code: 'GUDANG', label: 'Gudang', hint: 'Penerimaan barang & stok' },
  { code: 'KASIR', label: 'Kasir', hint: 'Melayani penjualan di kasir' },
] as const;

/** "Beranda" selalu tampil supaya setiap staf punya halaman awal. */
const CONFIGURABLE = MENU_KEYS.filter((key) => key !== 'dashboard');

/**
 * Kepala Toko menentukan menu apa saja yang tampil di app untuk tiap role
 * staf. Perubahan berlaku saat staf membuka app berikutnya.
 */
export default function MenuAccessScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const { matrix, matrixStatus } = useAppSelector((state) => state.access);
  const user = useAppSelector((state) => state.auth.user);
  const isKepalaToko = !!user?.roles.some((r) => r.roleCode === 'KEPALA_TOKO');
  const [role, setRole] = useState<(typeof ROLES)[number]['code']>('KASIR');
  const [draft, setDraft] = useState<Record<string, MenuKey[]>>({});
  const [draftActions, setDraftActions] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isKepalaToko) dispatch(fetchMenuAccess());
  }, [dispatch, isKepalaToko]);

  useEffect(() => {
    if (!matrix) return;
    setDraft(matrix.roles as Record<string, MenuKey[]>);
    setDraftActions(matrix.roleActions ?? {});
  }, [matrix]);

  const current = draft[role] ?? [];
  const saved = (matrix?.roles[role] ?? []) as MenuKey[];
  const currentActions = draftActions[role] ?? [];
  const savedActions = matrix?.roleActions?.[role] ?? [];
  const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x));
  const dirty = useMemo(
    () => !sameList(current, saved) || !sameList(currentActions, savedActions),
    [current, saved, currentActions, savedActions],
  );

  /** Turns one action (sub menu) on or off for the selected role. */
  const toggleAction = (action: string) => {
    setDraftActions((prev) => {
      const list = new Set(prev[role] ?? []);
      if (list.has(action)) list.delete(action);
      else list.add(action);
      return { ...prev, [role]: [...list] };
    });
  };

  const toggle = (key: MenuKey, value: boolean) => {
    setDraft((prev) => {
      const list = new Set(prev[role] ?? []);
      if (value) list.add(key);
      else list.delete(key);
      return { ...prev, [role]: MENU_KEYS.filter((k) => list.has(k)) };
    });
    // A hidden menu keeps no actions.
    if (!value) {
      setDraftActions((prev) => ({ ...prev, [role]: (prev[role] ?? []).filter((a) => !a.startsWith(`${key}.`)) }));
    }
  };

  const onSave = async () => {
    setSaving(true);
    try {
      await dispatch(saveMenuAccess({ roleCode: role, menus: current, actions: currentActions })).unwrap();
      Alert.alert('Tersimpan', `Menu untuk ${ROLES.find((r) => r.code === role)?.label} sudah diperbarui.`);
    } catch (error) {
      Alert.alert('Gagal', typeof error === 'string' ? error : 'Pengaturan menu gagal disimpan.');
    } finally {
      setSaving(false);
    }
  };

  if (!isKepalaToko) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <AppBar title="Hak Akses Menu" onBack={navigation.goBack} />
        <EmptyState
          icon={LockIcon}
          title="Khusus Kepala Toko"
          description="Hak akses menu dan aksi untuk setiap role hanya bisa diatur oleh Kepala Toko."
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <AppBar title="Hak Akses Menu" onBack={navigation.goBack} />

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <FadeInView>
          <View style={styles.intro}>
            <View style={styles.introIcon}>
              <LockIcon size={18} color={colors.primary[600]} />
            </View>
            <Text size="sm" color="secondary" style={styles.introText}>
              Pilih menu yang boleh dilihat tiap role, lalu atur aksinya (Tambah, Ubah, Hapus, dll.) di bawah
              setiap menu. Tanpa aksi, staf hanya bisa melihat. Kepala Toko selalu punya akses penuh.
            </Text>
          </View>
        </FadeInView>

        <View style={styles.roleRow}>
          {ROLES.map((item) => {
            const active = item.code === role;
            const count = (draft[item.code] ?? []).length;
            return (
              <PressableScale
                key={item.code}
                activeScale={0.96}
                onPress={() => setRole(item.code)}
                style={[styles.roleCard, active && styles.roleCardActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
              >
                <Text size="sm" weight="bold" style={active ? styles.roleLabelActive : undefined}>
                  {item.label}
                </Text>
                <Text size="xs" style={active ? styles.roleCountActive : styles.roleCount}>
                  {`${count} menu`}
                </Text>
              </PressableScale>
            );
          })}
        </View>
        <Text size="xs" color="muted" style={styles.roleHint}>
          {ROLES.find((r) => r.code === role)?.hint}
        </Text>

        <View style={styles.list}>
          {matrixStatus === 'loading' && !matrix ? (
            <Text color="muted" align="center" style={styles.loading}>
              Memuat pengaturan...
            </Text>
          ) : (
            CONFIGURABLE.map((key, index) => {
              const entry = MENU_CATALOG[key];
              const Icon = entry.icon;
              const enabled = current.includes(key);
              return (
                <FadeInView key={`${role}-${key}`} delay={staggerDelay(index)} offsetY={6}>
                  <View style={[styles.row, !enabled && index < CONFIGURABLE.length - 1 && styles.rowDivider]}>
                    <View style={[styles.rowIcon, { backgroundColor: entry.tintBg }, !enabled && styles.rowIconOff]}>
                      <Icon size={18} color={enabled ? entry.tint : colors.gray[400]} />
                    </View>
                    <View style={styles.rowText}>
                      <Text weight="semibold" size="sm" color={enabled ? 'primary' : 'muted'}>
                        {entry.label}
                      </Text>
                      <Text size="xs" color="muted" numberOfLines={1}>
                        {entry.hint}
                      </Text>
                    </View>
                    <Switch value={enabled} onValueChange={(value) => toggle(key, value)} />
                  </View>
                  {enabled ? (
                    <View style={[styles.subMenu, index < CONFIGURABLE.length - 1 && styles.rowDivider]}>
                      {matrix?.actions?.[key]?.length ? (
                        <Fragment>
                          <Text size="xs" weight="semibold" color="muted" style={styles.subLabel}>
                            AKSI DIIZINKAN
                          </Text>
                          <View style={styles.chips}>
                            {matrix.actions[key].map((def) => {
                              const code = `${key}.${def.code}`;
                              const on = currentActions.includes(code);
                              return (
                                <PressableScale
                                  key={code}
                                  activeScale={0.95}
                                  onPress={() => toggleAction(code)}
                                  style={[styles.chip, on && styles.chipOn]}
                                  accessibilityRole="checkbox"
                                  accessibilityState={{ checked: on }}
                                >
                                  <View style={[styles.check, on && styles.checkOn]}>
                                    {on ? <CheckIcon size={10} color={colors.white} /> : null}
                                  </View>
                                  <Text size="xs" weight="semibold" style={on ? styles.chipTextOn : styles.chipText}>
                                    {def.label}
                                  </Text>
                                </PressableScale>
                              );
                            })}
                          </View>
                          {!matrix.actions[key].some((def) => currentActions.includes(`${key}.${def.code}`)) ? (
                            <Text size="xs" color="muted" style={styles.subHint}>
                              Hanya bisa melihat
                            </Text>
                          ) : null}
                        </Fragment>
                      ) : (
                        <Text size="xs" color="muted">
                          Menu ini hanya untuk dilihat
                        </Text>
                      )}
                    </View>
                  ) : null}
                </FadeInView>
              );
            })
          )}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button fullWidth onPress={onSave} loading={saving} disabled={!dirty}>
          {dirty ? 'Simpan Perubahan' : 'Tidak ada perubahan'}
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  body: { padding: spacing.lg, paddingBottom: spacing['3xl'] },
  intro: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.base,
    borderRadius: radii.xl,
    backgroundColor: colors.primary[50],
    borderWidth: 1,
    borderColor: colors.primary[100],
  },
  introIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  introText: { flex: 1 },
  roleRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  roleCard: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.xl,
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleCardActive: { backgroundColor: colors.darkBg, borderColor: colors.darkBg },
  roleLabelActive: { color: colors.white },
  roleCount: { color: colors.text.muted },
  roleCountActive: { color: 'rgba(255,255,255,0.7)' },
  roleHint: { marginTop: spacing.sm, marginLeft: spacing.xs },
  list: {
    marginTop: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  loading: { paddingVertical: spacing.xl },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  rowIcon: { width: 38, height: 38, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  rowIconOff: { backgroundColor: colors.gray[50] },
  rowText: { flex: 1, gap: 1 },
  subMenu: {
    paddingLeft: spacing.md + 38 + spacing.md,
    paddingRight: spacing.md,
    paddingBottom: spacing.md,
    marginTop: -spacing.xs,
  },
  subLabel: { letterSpacing: 0.6, marginBottom: spacing.xs },
  subHint: { marginTop: spacing.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  chipOn: { borderColor: colors.primary[600], backgroundColor: colors.primary[50] },
  chipText: { color: colors.text.secondary },
  chipTextOn: { color: colors.primary[700] },
  check: {
    width: 14,
    height: 14,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  footer: {
    padding: spacing.lg,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
