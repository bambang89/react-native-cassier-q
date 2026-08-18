import { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSuppliers } from '@/store/slices/suppliersSlice';
import { fetchProducts } from '@/store/slices/productsSlice';
import { fetchProductUnits } from '@/store/slices/productUnitsSlice';
import { createPurchaseOrder } from '@/store/slices/purchaseOrdersSlice';
import type { CreatePurchaseOrderItemPayload } from '@/api/purchaseOrdersApi';
import { resolvePurchaseUnitChoices } from '@/utils/productUnits';
import type { RootStackParamList } from '@/navigation/types';
import type { Product } from '@/types/models';
import { colors, radii, spacing } from '@/theme';
import { Button, FormControl, Input, Select, TextArea } from '@/components/ui/forms';
import { AppBar, Card } from '@/components/ui/recipes';
import { ReceiptIcon, TrashIcon } from '@/components/icons/LineIcons';
import { Heading, Text } from '@/components/ui/typography';
import { HStack } from '@/components/ui/layout';

type Props = NativeStackScreenProps<RootStackParamList, 'PurchaseOrderForm'>;

type LineDraft = {
  key: string;
  productId: string | null;
  unitId: string | null;
  quantity: string;
  unitCost: string;
};

let lineKeySeq = 0;
function newLine(): LineDraft {
  lineKeySeq += 1;
  return { key: `line-${lineKeySeq}`, productId: null, unitId: null, quantity: '', unitCost: '' };
}

export default function PurchaseOrderFormScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const suppliers = useAppSelector((state) => state.suppliers.items);
  const products = useAppSelector((state) => state.products.items);
  const [supplierId, setSupplierId] = useState<string | null>(null);
  const [expectedDate, setExpectedDate] = useState('');
  const [notes, setNotes] = useState('');
  const [lines, setLines] = useState<LineDraft[]>([newLine()]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchSuppliers());
    dispatch(fetchProducts({}));
  }, [dispatch]);

  const activeSuppliers = useMemo(() => suppliers.filter((s) => s.active), [suppliers]);

  const updateLine = (key: string, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  };

  const removeLine = (key: string) => {
    setLines((prev) => (prev.length > 1 ? prev.filter((l) => l.key !== key) : prev));
  };

  const validLines = lines.filter(
    (l) => l.productId && l.unitId && Number(l.quantity) > 0 && Number(l.unitCost) >= 0,
  );
  const estimatedTotal = validLines.reduce((sum, l) => sum + Number(l.quantity) * Number(l.unitCost), 0);
  const canSubmit = !!supplierId && validLines.length > 0;

  const onSubmit = async () => {
    if (!supplierId) return;
    if (validLines.length === 0) {
      Alert.alert('Belum ada barang', 'Isi minimal satu baris barang (produk, satuan, jumlah, harga beli).');
      return;
    }
    setSubmitting(true);
    try {
      const items: CreatePurchaseOrderItemPayload[] = validLines.map((l) => ({
        productId: l.productId!,
        unitId: l.unitId!,
        quantity: Number(l.quantity),
        unitCost: Number(l.unitCost),
      }));
      const po = await dispatch(
        createPurchaseOrder({
          supplierId,
          expectedDate: expectedDate || undefined,
          notes: notes || undefined,
          items,
        }),
      ).unwrap();
      navigation.replace('PurchaseOrderDetail', { purchaseOrderId: po.id });
    } catch {
      Alert.alert('Gagal', 'Purchase order tidak bisa dibuat. Cek kembali data yang diisi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.flex}>
      <AppBar title="Buat Purchase Order" onBack={navigation.goBack} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {activeSuppliers.length === 0 ? (
          <Text size="sm" color="warning" style={styles.noSupplierHint}>
            Belum ada pemasok aktif. Buat pemasok dulu lewat menu Pemasok sebelum bisa membuat PO.
          </Text>
        ) : null}
        <FormControl label="Pemasok" isRequired>
          <Select
            value={supplierId}
            onChange={setSupplierId}
            placeholder="Pilih pemasok"
            options={activeSuppliers.map((s) => ({ label: s.supplierName, value: s.id }))}
          />
        </FormControl>
        <FormControl label="Perkiraan tanggal datang" helperText="Opsional, format YYYY-MM-DD">
          <Input value={expectedDate} onChangeText={setExpectedDate} placeholder="mis. 2026-08-25" />
        </FormControl>
        <FormControl label="Catatan">
          <TextArea value={notes} onChangeText={setNotes} placeholder="Opsional" numberOfLines={3} />
        </FormControl>

        <View style={styles.itemsTitleRow}>
          <ReceiptIcon size={15} color={colors.text.secondary} />
          <Heading level="h5">Daftar Barang</Heading>
        </View>
        {lines.map((line, index) => (
          <POLineRow
            key={line.key}
            index={index}
            line={line}
            products={products}
            onChange={(patch) => updateLine(line.key, patch)}
            onRemove={() => removeLine(line.key)}
            removable={lines.length > 1}
          />
        ))}
        <Button variant="outline" size="sm" style={styles.addLineButton} onPress={() => setLines((prev) => [...prev, newLine()])}>
          + Tambah Baris Barang
        </Button>

        {estimatedTotal > 0 ? (
          <Card style={styles.totalCard}>
            <Text size="sm" color="secondary">
              Perkiraan total pembelian
            </Text>
            <Heading level="h4">Rp {estimatedTotal.toLocaleString('id-ID')}</Heading>
          </Card>
        ) : null}

        <Button fullWidth onPress={onSubmit} loading={submitting} disabled={!canSubmit} style={styles.submitButton}>
          Buat PO
        </Button>
      </ScrollView>
    </View>
  );
}

function POLineRow({
  index,
  line,
  products,
  onChange,
  onRemove,
  removable,
}: {
  index: number;
  line: LineDraft;
  products: Product[];
  onChange: (patch: Partial<LineDraft>) => void;
  onRemove: () => void;
  removable: boolean;
}) {
  const dispatch = useAppDispatch();
  const product = products.find((p) => p.id === line.productId);
  const productUnits = useAppSelector((state) =>
    line.productId ? state.productUnits.byProductId[line.productId] : undefined,
  );

  useEffect(() => {
    if (line.productId && !productUnits) dispatch(fetchProductUnits(line.productId));
  }, [dispatch, line.productId, productUnits]);

  const unitChoices = product ? resolvePurchaseUnitChoices(productUnits ?? [], product) : [];
  const lineTotal = (Number(line.quantity) || 0) * (Number(line.unitCost) || 0);

  return (
    <Card style={styles.lineCard}>
      <View style={styles.lineHeader}>
        <Text weight="semibold" size="sm" color="secondary">
          Barang #{index + 1}
        </Text>
        {removable ? (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<TrashIcon size={14} color={colors.text.secondary} />}
            onPress={onRemove}
          >
            Hapus
          </Button>
        ) : null}
      </View>
      <FormControl label="Produk" isRequired>
        <Select
          value={line.productId}
          onChange={(v) => onChange({ productId: v, unitId: null })}
          placeholder="Pilih produk"
          options={products.map((p) => ({ label: p.productName, value: p.id }))}
        />
      </FormControl>
      <HStack space="md">
        <View style={styles.half}>
          <FormControl label="Satuan beli" isRequired>
            <Select
              value={line.unitId}
              onChange={(v) => onChange({ unitId: v })}
              placeholder="Satuan"
              isDisabled={!product}
              options={unitChoices.map((u) => ({ label: u.unitName, value: u.unitId }))}
            />
          </FormControl>
        </View>
        <View style={styles.half}>
          <FormControl label="Jumlah" isRequired>
            <Input keyboardType="numeric" value={line.quantity} onChangeText={(v) => onChange({ quantity: v })} placeholder="0" />
          </FormControl>
        </View>
      </HStack>
      <FormControl label="Harga beli per satuan" isRequired>
        <Input keyboardType="numeric" value={line.unitCost} onChangeText={(v) => onChange({ unitCost: v })} placeholder="0" />
      </FormControl>
      {lineTotal > 0 ? (
        <Text size="xs" color="link" align="right">
          Subtotal: Rp {lineTotal.toLocaleString('id-ID')}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  noSupplierHint: { marginBottom: spacing.base },
  itemsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  lineCard: { marginBottom: spacing.sm, backgroundColor: colors.surface },
  lineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  half: { flex: 1 },
  addLineButton: { alignSelf: 'flex-start', marginBottom: spacing.base },
  totalCard: { backgroundColor: colors.primary[50], borderRadius: radii.md, marginBottom: spacing.base },
  submitButton: { marginTop: spacing.sm },
});
