import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  createEmployee,
  deactivateEmployee,
  fetchEmployees,
  reactivateEmployee,
  updateEmployee,
} from '@/store/slices/employeesSlice';
import { fetchRoles } from '@/store/slices/rolesSlice';
import type { Employee } from '@/types/models';
import { colors, spacing } from '@/theme';
import { Button, FormControl, Input, Select } from '@/components/ui/forms';
import { Badge, Divider } from '@/components/ui/dataDisplay';
import { AlertDialog, Modal } from '@/components/ui/overlay';
import { Card, EmptyState, Header } from '@/components/ui/recipes';
import { EmployeeIcon } from '@/components/icons/LineIcons';
import { Text } from '@/components/ui/typography';

// Dipakai kalau GET /roles belum sempat termuat — biar Select role tidak kosong melompong.
const FALLBACK_ROLE_OPTIONS = [
  { label: 'Kasir', value: 'KASIR' },
  { label: 'Staf Produk', value: 'PRODUCT' },
  { label: 'Staf Gudang', value: 'GUDANG' },
  { label: 'Kepala Toko', value: 'KEPALA_TOKO' },
];

export default function EmployeesScreen() {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((state) => state.employees);
  const roles = useAppSelector((state) => state.roles.items);
  const [editing, setEditing] = useState<Employee | 'new' | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Employee | null>(null);

  useEffect(() => {
    dispatch(fetchEmployees());
    dispatch(fetchRoles());
  }, [dispatch]);

  const roleOptions = roles.length > 0 ? roles.map((r) => ({ label: r.roleName, value: r.roleCode })) : FALLBACK_ROLE_OPTIONS;
  const roleLabel = (code: string) => roleOptions.find((r) => r.value === code)?.label ?? code;

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

  return (
    <View style={styles.container}>
      <Header
        title="Karyawan"
        subtitle="Kelola akun & akses karyawan"
        rightElement={
          <Button size="sm" onPress={() => setEditing('new')}>
            + Baru
          </Button>
        }
      />

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
                <Text weight="bold" color="inverse">
                  {item.name.charAt(0).toUpperCase()}
                </Text>
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
                <Button variant="ghost" size="sm" onPress={() => setToggleTarget(item)}>
                  {item.active ? 'Nonaktifkan' : 'Aktifkan'}
                </Button>
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
    </View>
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
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = employee
    ? !!name && !!roleCode
    : !!name && !!username && password.length >= 8 && !!roleCode;

  const onSubmit = async () => {
    if (!roleCode) return;
    setSubmitting(true);
    try {
      if (employee) {
        await dispatch(
          updateEmployee({
            id: employee.employeeId,
            payload: { name, email: email || undefined, phone: phone || undefined, roleCode },
          }),
        ).unwrap();
      } else {
        await dispatch(
          createEmployee({ name, username, email: email || undefined, phone: phone || undefined, password, roleCode }),
        ).unwrap();
      }
      onDone();
    } catch {
      Alert.alert('Gagal', employee ? 'Data karyawan tidak bisa disimpan.' : 'Karyawan tidak bisa ditambahkan (mungkin username sudah dipakai).');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text weight="semibold" size="lg" style={styles.modalTitle}>
        {employee ? 'Ubah Karyawan' : 'Karyawan Baru'}
      </Text>
      <FormControl label="Nama" isRequired>
        <Input value={name} onChangeText={setName} placeholder="Nama lengkap" />
      </FormControl>
      {!employee ? (
        <>
          <FormControl label="Username" isRequired helperText="Dipakai untuk login, tidak bisa diubah nanti">
            <Input value={username} onChangeText={setUsername} placeholder="mis. kasir2" autoCapitalize="none" />
          </FormControl>
          <FormControl label="Kata sandi awal" isRequired helperText="Minimal 8 karakter">
            <Input value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />
          </FormControl>
        </>
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
  container: { flex: 1, backgroundColor: colors.background },
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
  },
  info: { flex: 1 },
  rightCol: { alignItems: 'flex-end', gap: spacing.xs },
  empty: { marginTop: spacing['3xl'] },
  modalTitle: { marginBottom: spacing.base },
  usernameHint: { marginBottom: spacing.base },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { minWidth: 90 },
});
