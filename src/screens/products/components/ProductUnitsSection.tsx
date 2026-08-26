import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProductUnits, registerProductUnit } from '@/store/slices/productUnitsSlice';
import { colors, spacing } from '@/theme';
import { Button, CheckBox, FormControl, Input, Select } from '@/components/ui/forms';
import { Badge } from '@/components/ui/dataDisplay';
import { Modal } from '@/components/ui/overlay';
import { Card } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import type { Product, Unit } from '@/types/models';

export function ProductUnitsSection({ product, allUnits }: { product: Product; allUnits: Unit[] }) {
  const dispatch = useAppDispatch();
  const productUnits = useAppSelector((state) => state.productUnits.byProductId[product.id]);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchProductUnits(product.id));
  }, [dispatch, product.id]);

  const registeredIds = new Set((productUnits ?? []).map((u) => u.unitId));
  const availableUnits = allUnits.filter((u) => !registeredIds.has(u.id));

  return (
    <FormControl label="Satuan alternatif">
      <Card>
        {!productUnits ? (
          <Text size="sm" color="muted">
            Memuat...
          </Text>
        ) : productUnits.length === 0 ? (
          <Text size="sm" color="muted">
            Cuma dijual dalam satuan dasar ({product.baseUnitName}).
          </Text>
        ) : (
          productUnits.map((u) => (
            <View key={u.unitId} style={styles.row}>
              <View style={styles.rowInfo}>
                <Text weight="medium">{u.unitName}</Text>
                <Text size="xs" color="secondary">
                  1 {u.unitName} = {u.conversionToBase} {product.baseUnitName}
                </Text>
              </View>
              <View style={styles.badges}>
                {u.baseUnit ? <Badge variant="neutral">Dasar</Badge> : null}
                {u.saleUnit ? <Badge variant="success">Jual</Badge> : null}
                {u.purchaseUnit ? <Badge variant="primary">Restock</Badge> : null}
              </View>
            </View>
          ))
        )}
        <Button
          variant="ghost"
          size="sm"
          style={styles.addButton}
          onPress={() => setFormOpen(true)}
          disabled={availableUnits.length === 0}
        >
          {availableUnits.length === 0 ? 'Semua satuan sudah didaftarkan' : '+ Tambah satuan alternatif'}
        </Button>
      </Card>

      <Modal isOpen={formOpen} onClose={() => setFormOpen(false)}>
        <RegisterUnitForm
          product={product}
          availableUnits={availableUnits}
          onDone={() => setFormOpen(false)}
          onCancel={() => setFormOpen(false)}
        />
      </Modal>
    </FormControl>
  );
}

function RegisterUnitForm({
  product,
  availableUnits,
  onDone,
  onCancel,
}: {
  product: Product;
  availableUnits: Unit[];
  onDone: () => void;
  onCancel: () => void;
}) {
  const dispatch = useAppDispatch();
  const [unitId, setUnitId] = useState<string | null>(null);
  const [conversionToBase, setConversionToBase] = useState('');
  const [saleUnit, setSaleUnit] = useState(true);
  const [purchaseUnit, setPurchaseUnit] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const selectedUnitName = availableUnits.find((u) => u.id === unitId)?.unitName ?? '';
  const ratio = Number(conversionToBase);
  const canSubmit = !!unitId && ratio > 0;

  const onSubmit = async () => {
    if (!unitId) return;
    setSubmitting(true);
    try {
      await dispatch(
        registerProductUnit({
          productId: product.id,
          payload: { unitId, conversionToBase: ratio, saleUnit, purchaseUnit },
        }),
      ).unwrap();
      onDone();
    } catch {
      Alert.alert('Gagal', 'Satuan tidak bisa didaftarkan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text weight="semibold" size="lg" style={styles.modalTitle}>
        Tambah Satuan Alternatif
      </Text>
      <FormControl label="Satuan" isRequired>
        <Select
          value={unitId}
          onChange={setUnitId}
          placeholder="Pilih satuan"
          options={availableUnits.map((u) => ({ label: `${u.unitName} (${u.unitCode})`, value: u.id }))}
        />
      </FormControl>
      <FormControl
        label={`Rasio ke satuan dasar (${product.baseUnitName})`}
        isRequired
        helperText={
          selectedUnitName ? `mis. isi 24 kalau 1 ${selectedUnitName} = 24 ${product.baseUnitName}` : undefined
        }
      >
        <Input
          value={conversionToBase}
          onChangeText={setConversionToBase}
          placeholder="0"
          keyboardType="numeric"
        />
      </FormControl>
      <View style={styles.checkboxRow}>
        <CheckBox value={saleUnit} onChange={setSaleUnit} label="Bisa dijual (muncul di kasir)" />
      </View>
      <View style={styles.checkboxRow}>
        <CheckBox value={purchaseUnit} onChange={setPurchaseUnit} label="Bisa dipakai untuk restock" />
      </View>
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowInfo: { flex: 1, marginRight: spacing.sm },
  badges: { flexDirection: 'row', gap: spacing.xs },
  addButton: { marginTop: spacing.sm, alignSelf: 'flex-start' },
  modalTitle: { marginBottom: spacing.base },
  checkboxRow: { marginBottom: spacing.sm },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { minWidth: 90 },
});
