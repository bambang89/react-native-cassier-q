import { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createUnit, deleteUnit, fetchUnits, updateUnit } from '@/store/slices/unitsSlice';
import type { RootStackParamList } from '@/navigation/types';
import type { Unit } from '@/types/models';
import { colors, spacing } from '@/theme';
import { Button, FormControl, Input } from '@/components/ui/forms';
import { Divider } from '@/components/ui/dataDisplay';
import { AlertDialog, Modal } from '@/components/ui/overlay';
import { AppBar, Card, EmptyState } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Units'>;

export default function UnitsScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((state) => state.units);
  const [editing, setEditing] = useState<Unit | 'new' | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Unit | null>(null);

  useEffect(() => {
    dispatch(fetchUnits());
  }, [dispatch]);

  const onDelete = async (unit: Unit) => {
    try {
      await dispatch(deleteUnit(unit.id)).unwrap();
      setDeleteTarget(null);
    } catch {
      Alert.alert('Gagal', 'Satuan tidak bisa dihapus (mungkin masih dipakai produk).');
      setDeleteTarget(null);
    }
  };

  return (
    <View style={styles.container}>
      <AppBar
        title="Satuan"
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
        onRefresh={() => dispatch(fetchUnits())}
        refreshing={status === 'loading'}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <Divider spacingY="xs" />}
        renderItem={({ item }) => (
          <Card shadow="none" style={styles.card} onPress={() => setEditing(item)}>
            <View style={styles.row}>
              <View style={styles.info}>
                <Text weight="semibold">{item.unitName}</Text>
                <Text size="xs" color="secondary">
                  {item.unitCode}
                </Text>
              </View>
              <Button variant="ghost" size="sm" onPress={() => setDeleteTarget(item)}>
                Hapus
              </Button>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          status === 'loading' ? (
            <Text color="muted" align="center" style={styles.empty}>
              Memuat satuan...
            </Text>
          ) : (
            <EmptyState
              icon="⚖️"
              title="Belum Ada Satuan"
              description="Satuan (Pcs, Dus, Kg, dll) dipakai untuk menentukan cara jual produk. Buat dulu sebelum menambah produk baru."
              actionLabel="+ Buat Satuan"
              onAction={() => setEditing('new')}
            />
          )
        }
      />

      <Modal isOpen={!!editing} onClose={() => setEditing(null)}>
        {editing ? (
          <UnitForm
            unit={editing === 'new' ? null : editing}
            onDone={() => setEditing(null)}
            onCancel={() => setEditing(null)}
          />
        ) : null}
      </Modal>

      <AlertDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Hapus satuan?"
        description={`"${deleteTarget?.unitName}" akan dihapus.`}
        confirmText="Hapus"
        isDanger
        onConfirm={() => deleteTarget && onDelete(deleteTarget)}
      />
    </View>
  );
}

function UnitForm({ unit, onDone, onCancel }: { unit: Unit | null; onDone: () => void; onCancel: () => void }) {
  const dispatch = useAppDispatch();
  const [unitCode, setUnitCode] = useState(unit?.unitCode ?? '');
  const [unitName, setUnitName] = useState(unit?.unitName ?? '');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      if (unit) {
        await dispatch(updateUnit({ id: unit.id, payload: { unitCode, unitName } })).unwrap();
      } else {
        await dispatch(createUnit({ unitCode, unitName })).unwrap();
      }
      onDone();
    } catch {
      Alert.alert('Gagal', 'Satuan tidak bisa disimpan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text weight="semibold" size="lg" style={styles.modalTitle}>
        {unit ? 'Ubah Satuan' : 'Satuan Baru'}
      </Text>
      <FormControl label="Kode satuan" isRequired helperText="mis. PCS, DUS, KG">
        <Input value={unitCode} onChangeText={setUnitCode} placeholder="mis. PCS" autoCapitalize="characters" />
      </FormControl>
      <FormControl label="Nama satuan" isRequired>
        <Input value={unitName} onChangeText={setUnitName} placeholder="mis. Pieces" />
      </FormControl>
      <View style={styles.modalActions}>
        <Button variant="ghost" onPress={onCancel} style={styles.modalAction}>
          Batal
        </Button>
        <Button onPress={onSubmit} loading={submitting} disabled={!unitCode || !unitName} style={styles.modalAction}>
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
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  info: { flex: 1 },
  empty: { marginTop: spacing['3xl'] },
  modalTitle: { marginBottom: spacing.base },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { minWidth: 90 },
});
