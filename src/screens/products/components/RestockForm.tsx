import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProductUnits } from '@/store/slices/productUnitsSlice';
import { restockProduct } from '@/store/slices/productsSlice';
import { resolvePurchaseUnitChoices } from '@/utils/productUnits';
import { spacing } from '@/theme';
import { Button, FormControl, Input, Select } from '@/components/ui/forms';
import { Text } from '@/components/ui/typography';
import type { Product } from '@/types/models';

export function RestockForm({
  product,
  onDone,
  onCancel,
}: {
  product: Product;
  onDone: () => void;
  onCancel: () => void;
}) {
  const dispatch = useAppDispatch();
  const units = useAppSelector((state) => state.productUnits.byProductId[product.id]);
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [unitId, setUnitId] = useState(product.baseUnitId);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!units) dispatch(fetchProductUnits(product.id));
  }, [dispatch, product.id, units]);

  const choices = resolvePurchaseUnitChoices(units ?? [], product);
  const selectedUnitName = choices.find((c) => c.unitId === unitId)?.unitName ?? product.baseUnitName;

  const onSubmit = async () => {
    const parsed = Number(quantity);
    if (!parsed || parsed <= 0) return;
    setSubmitting(true);
    try {
      await dispatch(
        restockProduct({
          id: product.id,
          payload: { unitId, quantity: parsed, notes: notes || undefined },
        }),
      ).unwrap();
      onDone();
    } catch {
      Alert.alert('Gagal', 'Restock gagal, coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text weight="semibold" size="lg" style={styles.modalTitle}>
        Tambah Stok — {product.productName}
      </Text>
      {choices.length > 1 ? (
        <FormControl label="Satuan restock">
          <Select
            value={unitId}
            onChange={setUnitId}
            options={choices.map((c) => ({ label: c.unitName, value: c.unitId }))}
          />
        </FormControl>
      ) : null}
      <FormControl label={`Jumlah (${selectedUnitName})`}>
        <Input keyboardType="numeric" value={quantity} onChangeText={setQuantity} placeholder="0" />
      </FormControl>
      <FormControl label="Catatan (opsional)">
        <Input value={notes} onChangeText={setNotes} placeholder="mis. pembelian dari supplier X" />
      </FormControl>
      <View style={styles.modalActions}>
        <Button variant="ghost" onPress={onCancel} style={styles.modalAction}>
          Batal
        </Button>
        <Button onPress={onSubmit} loading={submitting} disabled={!quantity} style={styles.modalAction}>
          Simpan
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalTitle: { marginBottom: spacing.base },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { minWidth: 90 },
});
