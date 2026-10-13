import { Fragment, useEffect, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  deactivateEmployee,
  fetchEmployees,
  reactivateEmployee,
} from '@/store/slices/employeesSlice';
import { fetchRoles } from '@/store/slices/rolesSlice';
import { fetchStoreProfile } from '@/store/slices/storeProfileSlice';
import { useResponsive } from '@/hooks/useResponsive';
import type { Employee } from '@/types/models';
import * as employeesApi from '@/api/employeesApi';
import type { ProductPhotoFile } from '@/api/productsApi';
import { apiErrorMessage } from '@/api/errors';
import { choosePhoto } from '@/services/photos/pickPhoto';
import { colors, radii, spacing } from '@/theme';
import { tabletColors } from '@/theme/tabletColors';
import { Button, FormControl, Input, Pressable, Select } from '@/components/ui/forms';
import { Badge, Divider } from '@/components/ui/dataDisplay';
import { AlertDialog, Modal } from '@/components/ui/overlay';
import { Card, EmptyState, Fab, Header, TabletTopBar } from '@/components/ui/recipes';
import { EmployeeIcon, MoreIcon, PencilIcon, PlusIcon } from '@/components/icons/LineIcons';
import { Text } from '@/components/ui/typography';

// Dipakai kalau GET /roles belum sempat termuat — biar Select role tidak kosong melompong.
// Hanya role staf: Kepala Toko mengelola Produk, Gudang & Kasir (role Kepala Toko
// hanya bisa diberikan pemilik aplikasi, dan backend yang menentukan daftarnya).
const FALLBACK_ROLE_OPTIONS = [
  { label: 'Kasir', value: 'KASIR' },
  { label: 'Staf Produk', value: 'PRODUCT' },
  { label: 'Staf Gudang', value: 'GUDANG' },
];

const ROLE_LABELS: Record<string, string> = {
  SUPERADMIN: 'Pemilik Aplikasi',
  KEPALA_TOKO: 'Kepala Toko',
  PRODUCT: 'Staf Produk',
  GUDANG: 'Staf Gudang',
  KASIR: 'Kasir',
};

export default function EmployeesScreen() {
  const dispatch = useAppDispatch();
  const { isTabletLandscape } = useResponsive();
  const { items, status } = useAppSelector((state) => state.employees);
  const roles = useAppSelector((state) => state.roles.items);
  const user = useAppSelector((state) => state.auth.user);
  const storeProfile = useAppSelector((state) => state.storeProfile.profile);
  const [editing, setEditing] = useState<Employee | 'new' | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Employee | null>(null);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchRoles());
    dispatch(fetchStoreProfile());
  }, [dispatch]);

  const roleOptions = roles.length > 0 ? roles.map((r) => ({ label: r.roleName, value: r.roleCode })) : FALLBACK_ROLE_OPTIONS;
  const roleLabel = (code: string) =>
    roleOptions.find((r) => r.value === code)?.label ?? ROLE_LABELS[code] ?? code;
  // Kepala Toko tidak bisa menonaktifkan dirinya sendiri atau sesama Kepala Toko
  // (backend juga menolaknya) — tombolnya tidak ditampilkan.
  const canToggle = (employee: Employee) =>
    employee.userId !== user?.id && (!!user?.superadmin || !employee.roles.includes('KEPALA_TOKO'));

  const onToggleActive = async (employee: Employee) => {
    try {
      if (employee.active) {
        await dispatch(deactivateEmployee(employee.employeeId)).unwrap();
      } else {
        await dispatch(reactivateEmployee(employee.employeeId)).unwrap();
      }
      setToggleTarget(null);
    } catch {
      Alert.alert('Gagal', 'Status karyawan tidak bisa diubah.');
      setToggleTarget(null);
    }
  };

  const primaryRole = user?.roles?.[0] ?? null;
  const storeName = storeProfile?.storeName ?? primaryRole?.storeName ?? '-';

  const editModal = (
    <Modal isOpen={!!editing} onClose={() => setEditing(null)}>
      {editing ? (
        <EmployeeForm
          employee={editing === 'new' ? null : editing}
          roleOptions={roleOptions}
          onDone={() => setEditing(null)}
          onCancel={() => setEditing(null)}
        />
      ) : null}
    </Modal>
  );

  const toggleDialog = (
    <AlertDialog
      isOpen={!!toggleTarget}
      onClose={() => setToggleTarget(null)}
      title={toggleTarget?.active ? 'Nonaktifkan karyawan?' : 'Aktifkan kembali karyawan?'}
      description={
        toggleTarget?.active
          ? `"${toggleTarget?.name}" tidak akan bisa login lagi, sesi aktifnya juga langsung dicabut.`
          : `"${toggleTarget?.name}" akan bisa login lagi seperti biasa.`
      }
      confirmText={toggleTarget?.active ? 'Nonaktifkan' : 'Aktifkan'}
      isDanger={!!toggleTarget?.active}
      onConfirm={() => toggleTarget && onToggleActive(toggleTarget)}
    />
  );

  if (isTabletLandscape) {
    return (
      <SafeAreaView style={[styles.container, styles.containerTablet]} edges={['top', 'left', 'right']}>
        <TabletTopBar
          title="Karyawan"
          subtitle={`${items.length} akun karyawan`}
          storeName={storeName}
          userName={user?.name ?? 'Kasir'}
          rightAction={
            <Button size="sm" style={{ backgroundColor: tabletColors.blue600 }} onPress={() => setEditing('new')}>
              + Baru
            </Button>
          }
        />
        <View style={styles.tabletBody}>
          <View style={styles.tableCard}>
            <View style={styles.tableHeadRow}>
              <Text style={[styles.tableHeadCell, styles.colName]}>Nama</Text>
              <Text style={[styles.tableHeadCell, styles.colRole]}>Peran</Text>
              <Text style={[styles.tableHeadCell, styles.colStatus]}>Status</Text>
              <Text style={[styles.tableHeadCell, styles.colAction]}>Aksi</Text>
            </View>
            <FlatList
              style={styles.tableList}
              data={items}
              keyExtractor={(item) => item.employeeId}
              onRefresh={() => dispatch(fetchEmployees())}
              refreshing={status === 'loading'}
              renderItem={({ item }) => (
                <View style={styles.tableRow}>
                  <View style={[styles.colName, styles.nameCell]}>
                    <View style={styles.tableAvatar}>
                      {item.photoUrl ? (
                        <Image source={{ uri: item.photoUrl }} style={styles.photoImage} />
                      ) : (
                        <Text weight="bold" color="inverse" size="xs">
                          {item.name.charAt(0).toUpperCase()}
                        </Text>
                      )}
                    </View>
                    <View style={styles.nameCellInfo}>
                      <Text style={styles.cellMain} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.cellMuted}>@{item.username}</Text>
                    </View>
                  </View>
                  <View style={styles.colRole}>
                    <Badge variant="primary">{item.roles.map(roleLabel).join(', ')}</Badge>
                  </View>
                  <View style={styles.colStatus}>
                    <Badge variant={item.active ? 'success' : 'neutral'}>{item.active ? 'Aktif' : 'Nonaktif'}</Badge>
                  </View>
                  <View style={[styles.colAction, styles.actionCell]}>
                    <Pressable style={styles.tableIconButton} onPress={() => setEditing(item)} accessibilityLabel="Ubah">
                      <PencilIcon size={14} color={tabletColors.gray600} />
                    </Pressable>
                    {canToggle(item) ? (
                      <Pressable
                        style={styles.tableIconButton}
                        onPress={() => setToggleTarget(item)}
                        accessibilityLabel={item.active ? 'Nonaktifkan' : 'Aktifkan'}
                      >
                        <MoreIcon size={14} color={tabletColors.gray600} />
                      </Pressable>
                    ) : null}
                  </View>
                </View>
              )}
              ListEmptyComponent={
                status === 'loading' ? (
                  <Text color="muted" align="center" style={styles.empty}>
                    Memuat karyawan...
                  </Text>
                ) : (
                  <EmptyState
                    icon={EmployeeIcon}
                    title="Belum Ada Karyawan Lain"
                    description="Tambahkan akun untuk kasir/staf lain di toko ini."
                    actionLabel="+ Tambah Karyawan"
                    onAction={() => setEditing('new')}
                  />
                )
              }
            />
          </View>
        </View>
        {editModal}
        {toggleDialog}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header title="Karyawan" subtitle="Kelola akun & akses karyawan" />

      <FlatList
        data={items}
        keyExtractor={(item) => item.employeeId}
        onRefresh={() => dispatch(fetchEmployees())}
        refreshing={status === 'loading'}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <Divider spacingY="xs" />}
        renderItem={({ item }) => (
          <Card shadow="none" style={styles.card} onPress={() => setEditing(item)}>
            <View style={styles.row}>
              <View style={styles.avatar}>
                {item.photoUrl ? (
                  <Image source={{ uri: item.photoUrl }} style={styles.photoImage} />
                ) : (
                  <Text weight="bold" color="inverse">
                    {item.name.charAt(0).toUpperCase()}
                  </Text>
                )}
              </View>
              <View style={styles.info}>
                <Text weight="semibold" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text size="xs" color="secondary">
                  @{item.username} · {item.roles.map(roleLabel).join(', ')}
                </Text>
              </View>
              <View style={styles.rightCol}>
                <Badge variant={item.active ? 'success' : 'neutral'}>{item.active ? 'Aktif' : 'Nonaktif'}</Badge>
                {canToggle(item) ? (
                  <Button variant="ghost" size="sm" onPress={() => setToggleTarget(item)}>
                    {item.active ? 'Nonaktifkan' : 'Aktifkan'}
                  </Button>
                ) : null}
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          status === 'loading' ? (
            <Text color="muted" align="center" style={styles.empty}>
              Memuat karyawan...
            </Text>
          ) : (
            <EmptyState
              icon={EmployeeIcon}
              title="Belum Ada Karyawan Lain"
              description="Tambahkan akun untuk kasir/staf lain di toko ini — masing-masing bisa punya role sendiri (Kasir, Gudang, dst)."
              actionLabel="+ Tambah Karyawan"
              onAction={() => setEditing('new')}
            />
          )
        }
      />

      <Modal isOpen={!!editing} onClose={() => setEditing(null)}>
        {editing ? (
          <EmployeeForm
            employee={editing === 'new' ? null : editing}
            roleOptions={roleOptions}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </Modal>

      <AlertDialog
        isOpen={!!toggleTarget}
        onClose={() => setToggleTarget(null)}
        title={toggleTarget?.active ? 'Nonaktifkan karyawan?' : 'Aktifkan kembali karyawan?'}
        description={
          toggleTarget?.active
            ? `"${toggleTarget?.name}" tidak akan bisa login lagi, sesi aktifnya juga langsung dicabut.`
            : `"${toggleTarget?.name}" akan bisa login lagi seperti biasa.`
        }
        confirmText={toggleTarget?.active ? 'Nonaktifkan' : 'Aktifkan'}
        isDanger={!!toggleTarget?.active}
        onConfirm={() => toggleTarget && onToggleActive(toggleTarget)}
      />
      <Fab icon={PlusIcon} accessibilityLabel="Tambah karyawan" onPress={() => setEditing('new')} />
    </SafeAreaView>
  );
}

function EmployeeForm({
  employee,
  roleOptions,
  onDone,
  onCancel,
}: {
  employee: Employee | null;
  roleOptions: { label: string; value: string }[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState(employee?.name ?? '');
  const [username, setUsername] = useState(employee?.username ?? '');
  const [email, setEmail] = useState(employee?.email ?? '');
  const [phone, setPhone] = useState(employee?.phone ?? '');
  const [password, setPassword] = useState('');
  const [roleCode, setRoleCode] = useState<string | null>(employee?.roles[0] ?? null);
  const [nationalId, setNationalId] = useState(employee?.nationalId ?? '');
  const [employeeNumber, setEmployeeNumber] = useState(employee?.employeeNumber ?? '');
  // Photo chosen in the form; uploaded after the employee is saved. 'remove' clears the current one.
  const [photo, setPhoto] = useState<ProductPhotoFile | 'remove' | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const nationalIdValid = nationalId === '' || /^\d{16}$/.test(nationalId);
  const canSubmit =
    nationalIdValid &&
    (employee ? !!name && !!roleCode : !!name && !!username && password.length >= 8 && !!roleCode);
  const previewUri = photo === 'remove' ? null : photo ? photo.uri : (employee?.photoUrl ?? null);

  /** Picks a photo (camera/gallery) or marks the current one for removal. */
  const pickEmployeePhoto = () =>
    choosePhoto((file) => setPhoto(file), {
      title: 'Foto karyawan',
      onRemove: previewUri ? () => setPhoto('remove') : undefined,
    });

  const onSubmit = async () => {
    if (!roleCode) return;
    setSubmitting(true);
    const identity = {
      nationalId: nationalId.trim() || undefined,
      employeeNumber: employeeNumber.trim() || undefined,
    };
    try {
      const saved = employee
        ? await employeesApi.updateEmployee(employee.employeeId, {
            name,
            email: email || undefined,
            phone: phone || undefined,
            roleCode,
            ...identity,
          })
        : await employeesApi.createEmployee({
            name,
            username,
            email: email || undefined,
            phone: phone || undefined,
            password,
            roleCode,
            ...identity,
          });
      try {
        if (photo === 'remove') await employeesApi.removeEmployeePhoto(saved.employeeId);
        else if (photo) await employeesApi.uploadEmployeePhoto(saved.employeeId, photo);
      } catch (error) {
        Alert.alert('Foto belum tersimpan', apiErrorMessage(error, 'Data karyawan tersimpan, tetapi fotonya gagal diunggah.'));
      }
      dispatch(fetchEmployees());
      onDone();
    } catch (error) {
      Alert.alert(
        'Gagal',
        apiErrorMessage(
          error,
          employee ? 'Data karyawan tidak bisa disimpan.' : 'Karyawan tidak bisa ditambahkan (mungkin username sudah dipakai).',
        ),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text weight="semibold" size="lg" style={styles.modalTitle}>
        {employee ? 'Ubah Karyawan' : 'Karyawan Baru'}
      </Text>
      <View style={styles.photoRow}>
        <Pressable onPress={pickEmployeePhoto} accessibilityRole="button" accessibilityLabel="Pilih foto karyawan">
          <View style={styles.photoCircle}>
            {previewUri ? (
              <Image source={{ uri: previewUri }} style={styles.photoImage} />
            ) : (
              <Text weight="bold" size="xl" color="inverse">
                {(name || '?').charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={styles.photoBadge}>
            <PencilIcon size={11} color={colors.white} />
          </View>
        </Pressable>
        <View style={styles.photoInfo}>
          <Text weight="semibold" size="sm">
            Foto karyawan
          </Text>
          <Text size="xs" color="muted">
            Opsional · JPG/PNG/WEBP maks. 5MB
          </Text>
          <Pressable onPress={pickEmployeePhoto} hitSlop={6}>
            <Text size="xs" weight="semibold" style={styles.photoLink}>
              {previewUri ? 'Ganti / hapus foto' : 'Tambah foto'}
            </Text>
          </Pressable>
        </View>
      </View>
      <FormControl label="Nama" isRequired>
        <Input value={name} onChangeText={setName} placeholder="Nama lengkap" />
      </FormControl>
      {!employee ? (
        <Fragment>
          <FormControl label="Username" isRequired helperText="Dipakai untuk login, tidak bisa diubah nanti">
            <Input value={username} onChangeText={setUsername} placeholder="mis. kasir2" autoCapitalize="none" />
          </FormControl>
          <FormControl label="Kata sandi awal" isRequired helperText="Minimal 8 karakter">
            <Input value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
          </FormControl>
        </Fragment>
      ) : (
        <Text size="xs" color="muted" style={styles.usernameHint}>
          Username: @{employee.username} (tidak bisa diubah di sini)
        </Text>
      )}
      <FormControl label="Email">
        <Input value={email} onChangeText={setEmail} placeholder="Opsional" autoCapitalize="none" keyboardType="email-address" />
      </FormControl>
      <FormControl label="No. HP">
        <Input value={phone} onChangeText={setPhone} placeholder="Opsional" keyboardType="phone-pad" />
      </FormControl>
      <FormControl label="Role" isRequired>
        <Select value={roleCode} onChange={setRoleCode} placeholder="Pilih role" options={roleOptions} />
      </FormControl>
      <FormControl
        label="NIK KTP"
        isInvalid={!nationalIdValid}
        errorText="NIK KTP harus 16 angka"
        helperText="Opsional · 16 angka sesuai KTP"
      >
        <Input
          value={nationalId}
          onChangeText={(v) => setNationalId(v.replace(/\D/g, '').slice(0, 16))}
          placeholder="Opsional"
          keyboardType="number-pad"
          maxLength={16}
        />
      </FormControl>
      <FormControl label="NIK Karyawan" helperText="Opsional · nomor induk karyawan di toko">
        <Input
          value={employeeNumber}
          onChangeText={setEmployeeNumber}
          placeholder="mis. HDY-2026-001"
          autoCapitalize="characters"
          maxLength={50}
        />
      </FormControl>
      <View style={styles.modalActions}>
        <Button variant="ghost" onPress={onCancel} style={styles.modalAction}>
          Batal
        </Button>
        <Button onPress={onSubmit} loading={submitting} disabled={!canSubmit} style={styles.modalAction}>
          Simpan
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  containerTablet: { backgroundColor: tabletColors.gray25 },
  tabletBody: { flex: 1, padding: 24 },
  tableCard: {
    flex: 1,
    backgroundColor: tabletColors.white,
    borderWidth: 1,
    borderColor: tabletColors.gray150,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  tableList: { flex: 1 },
  tableHeadRow: {
    flexDirection: 'row',
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: tabletColors.gray150,
    backgroundColor: tabletColors.gray25,
  },
  tableHeadCell: {
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    color: tabletColors.gray500,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: tabletColors.gray100,
  },
  colName: { flex: 2 },
  colRole: { flex: 1 },
  colStatus: { flex: 1 },
  colAction: { width: 80 },
  nameCell: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  nameCellInfo: { flex: 1 },
  tableAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: tabletColors.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.base },
  photoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    overflow: 'hidden',
  },
  photoImage: { width: '100%', height: '100%' },
  photoBadge: {
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
    borderColor: colors.white,
  },
  photoInfo: { flex: 1, gap: 2 },
  photoLink: { color: colors.primary[600], marginTop: 2 },
  cellMain: { fontSize: 13, fontWeight: '600', color: tabletColors.gray900 },
  cellMuted: { fontSize: 11.5, color: tabletColors.gray500, marginTop: 1 },
  actionCell: { flexDirection: 'row', gap: 6 },
  tableIconButton: {
    width: 30,
    height: 30,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: tabletColors.gray200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: { padding: spacing.base },
  card: { paddingVertical: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  info: { flex: 1 },
  rightCol: { alignItems: 'flex-end', gap: spacing.xs },
  empty: { marginTop: spacing['3xl'] },
  modalTitle: { marginBottom: spacing.base },
  usernameHint: { marginBottom: spacing.base },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { minWidth: 90 },
});
