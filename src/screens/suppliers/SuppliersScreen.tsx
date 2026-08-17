import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createSupplier, deactivateSupplier, fetchSuppliers, updateSupplier } from '@/store/slices/suppliersSlice';
import type { RootStackParamList } from '@/navigation/types';
import type { Supplier } from '@/types/models';
import { colors, spacing } from '@/theme';
import { Button, FormControl, Input } from '@/components/ui/forms';
import { Badge, Divider } from '@/components/ui/dataDisplay';
import { AlertDialog, Modal } from '@/components/ui/overlay';
import { AppBar, Card, EmptyState } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Suppliers'>;

export default function SuppliersScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((state) => state.suppliers);
  const [editing, setEditing] = useState<Supplier | 'new' | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Supplier | null>(null);

  useEffect(() => {
    dispatch(fetchSuppliers());
  }, [dispatch]);

  const onDeactivate = async (supplier: Supplier) => {
    try {
      await dispatch(deactivateSupplier(supplier.id)).unwrap();
      setDeactivateTarget(null);
    } catch {
      Alert.alert('Gagal', 'Pemasok tidak bisa dinonaktifkan.');
      setDeactivateTarget(null);
    }
  };

  return (
    <View style={styles.container}>
      <AppBar
        title="Pemasok"
        onBack={navigation.goBack}
        rightElement={
          <Button size="sm" onPress={() => setEditing('new')}>
            + Baru
          </Button>
        }
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={() => dispatch(fetchSuppliers())}
        refreshing={status === 'loading'}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <Divider spacingY="xs" />}
        renderItem={({ item }) => (
          <Card shadow="none" style={styles.card} onPress={() => setEditing(item)}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text weight="semibold" numberOfLines={1}>
                  {item.supplierName}
                </Text>
                <Text size="xs" color="secondary">
                  {item.supplierCode}
                  {item.contactPerson ? ` · ${item.contactPerson}` : ''}
                  {item.phone ? ` · ${item.phone}` : ''}
                </Text>
              </View>
              {item.active ? (
                <Button variant="ghost" size="sm" onPress={() => setDeactivateTarget(item)}>
                  Nonaktifkan
                </Button>
              ) : (
                <Badge variant="neutral">Nonaktif</Badge>
              )}
            </View>
          </Card>
        )}
        ListEmptyComponent={
          status === 'loading' ? (
            <Text color="muted" align="center" style={styles.empty}>
              Memuat pemasok...
            </Text>
          ) : (
            <EmptyState
              icon="🚚"
              title="Belum Ada Pemasok"
              description="Daftarkan pemasok dulu supaya bisa membuat Purchase Order (PO) pembelian barang."
              actionLabel="+ Tambah Pemasok"
              onAction={() => setEditing('new')}
            />
          )
        }
      />

      <Modal isOpen={!!editing} onClose={() => setEditing(null)}>
        {editing ? (
          <SupplierForm
            supplier={editing === 'new' ? null : editing}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </Modal>

      <AlertDialog
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        title="Nonaktifkan pemasok?"
        description={`"${deactivateTarget?.supplierName}" tidak akan muncul lagi saat membuat PO baru.`}
        confirmText="Nonaktifkan"
        isDanger
        onConfirm={() => deactivateTarget && onDeactivate(deactivateTarget)}
      />
    </View>
  );
}

function SupplierForm({
  supplier,
  onDone,
  onCancel,
}: {
  supplier: Supplier | null;
  onDone: () => void;
  onCancel: () => void;
}) {
  const dispatch = useAppDispatch();
  const [supplierCode, setSupplierCode] = useState(supplier?.supplierCode ?? '');
  const [supplierName, setSupplierName] = useState(supplier?.supplierName ?? '');
  const [contactPerson, setContactPerson] = useState(supplier?.contactPerson ?? '');
  const [phone, setPhone] = useState(supplier?.phone ?? '');
  const [email, setEmail] = useState(supplier?.email ?? '');
  const [address, setAddress] = useState(supplier?.address ?? '');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        supplierCode,
        supplierName,
        contactPerson: contactPerson || undefined,
        phone: phone || undefined,
        email: email || undefined,
        address: address || undefined,
      };
      if (supplier) {
        await dispatch(updateSupplier({ id: supplier.id, payload })).unwrap();
      } else {
        await dispatch(createSupplier(payload)).unwrap();
      }
      onDone();
    } catch {
      Alert.alert('Gagal', 'Data pemasok tidak bisa disimpan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text weight="semibold" size="lg" style={styles.modalTitle}>
        {supplier ? 'Ubah Pemasok' : 'Pemasok Baru'}
      </Text>
      <FormControl label="Kode pemasok" isRequired helperText="mis. SUP-001">
        <Input value={supplierCode} onChangeText={setSupplierCode} placeholder="mis. SUP-001" autoCapitalize="characters" />
      </FormControl>
      <FormControl label="Nama pemasok" isRequired>
        <Input value={supplierName} onChangeText={setSupplierName} placeholder="Nama toko/perusahaan pemasok" />
      </FormControl>
      <FormControl label="Nama kontak (PIC)">
        <Input value={contactPerson} onChangeText={setContactPerson} placeholder="Opsional" />
      </FormControl>
      <FormControl label="No. HP">
        <Input value={phone} onChangeText={setPhone} placeholder="Opsional" keyboardType="phone-pad" />
      </FormControl>
      <FormControl label="Email">
        <Input value={email} onChangeText={setEmail} placeholder="Opsional" autoCapitalize="none" keyboardType="email-address" />
      </FormControl>
      <FormControl label="Alamat">
        <Input value={address} onChangeText={setAddress} placeholder="Opsional" />
      </FormControl>
      <View style={styles.modalActions}>
        <Button variant="ghost" onPress={onCancel} style={styles.modalAction}>
          Batal
        </Button>
        <Button
          onPress={onSubmit}
          loading={submitting}
          disabled={!supplierCode || !supplierName}
          style={styles.modalAction}
        >
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  info: { flex: 1 },
  empty: { marginTop: spacing['3xl'] },
  modalTitle: { marginBottom: spacing.base },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { minWidth: 90 },
});
