import { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCategories } from '@/store/slices/categoriesSlice';
import { fetchUnits } from '@/store/slices/unitsSlice';
import { fetchProductUnits, registerProductUnit } from '@/store/slices/productUnitsSlice';
import { createProduct, updateProduct } from '@/store/slices/productsSlice';
import type { RootStackParamList } from '@/navigation/types';
import type { Product, Unit } from '@/types/models';
import { colors, spacing } from '@/theme';
import { Button, CheckBox, FormControl, Input, Link, Select, TextArea } from '@/components/ui/forms';
import { Badge } from '@/components/ui/dataDisplay';
import { Modal } from '@/components/ui/overlay';
import { AppBar, Card } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { HStack } from '@/components/ui/layout';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductForm'>;

export default function ProductFormScreen({ navigation, route }: Props) {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.categories.items);
  const units = useAppSelector((state) => state.units.items);
  const editing = route.params?.product;

  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [productName, setProductName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [baseUnitId, setBaseUnitId] = useState<string | null>(null);
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchUnits());
  }, [dispatch]);

  // Form ini bisa "berpindah target" tanpa remount — lihat tombol Scan di
  // bawah, yang update route.params via setParams saat produk ketemu/tidak
  // ketemu. Reset semua field tiap kali target (atau prefill barcode) itu
  // berubah, karena useState hanya baca nilai awal sekali saat mount.
  useEffect(() => {
    const p = route.params?.product;
    setSku(p?.sku ?? '');
    setBarcode(p?.barcode ?? route.params?.prefillBarcode ?? '');
    setProductName(p?.productName ?? '');
    setCategoryId(p?.categoryId ?? null);
    setBrand(p?.brand ?? '');
    setDescription(p?.description ?? '');
    setImageUrl(p?.imageUrl ?? '');
    setBaseUnitId(p?.baseUnitId ?? null);
    setSellingPrice(p?.sellingPrice ? String(p.sellingPrice) : '');
    setCostPrice(p?.costPrice ? String(p.costPrice) : '');
  }, [route.params?.product, route.params?.prefillBarcode]);

  const canSubmit = !!(sku && productName && categoryId && baseUnitId && sellingPrice);

  const onScan = () => {
    navigation.navigate('Scanner', {
      onFound: (product) => {
        // Produk lain sudah punya barcode ini — buka buat diedit.
        navigation.setParams({ product, prefillBarcode: undefined });
      },
      onNotFound: (scannedBarcode) => {
        // Belum terdaftar — reset form ke mode tambah baru, barcode-nya sudah terisi.
        navigation.setParams({ product: undefined, prefillBarcode: scannedBarcode });
      },
    });
  };

  const onSubmit = async () => {
    if (!categoryId || !baseUnitId) return;
    setSubmitting(true);
    try {
      const payload = {
        sku,
        barcode: barcode || undefined,
        productName,
        categoryId,
        brand: brand || undefined,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        baseUnitId,
        sellingPrice: Number(sellingPrice),
        costPrice: costPrice ? Number(costPrice) : undefined,
      };
      if (editing) {
        await dispatch(updateProduct({ id: editing.id, payload })).unwrap();
      } else {
        await dispatch(createProduct(payload)).unwrap();
      }
      navigation.goBack();
    } catch {
      Alert.alert('Gagal', 'Produk tidak bisa disimpan. Cek kembali data yang diisi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AppBar
        title={editing ? 'Ubah Produk' : 'Tambah Produk'}
        onBack={navigation.goBack}
        rightElement={
          <Button size="sm" variant="outline" onPress={onScan}>
            📷 Scan
          </Button>
        }
      />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <HStack space="md">
          <View style={styles.formHalf}>
            <FormControl label="SKU" isRequired>
              <Input value={sku} onChangeText={setSku} placeholder="mis. SKU-001" autoCapitalize="characters" />
            </FormControl>
          </View>
          <View style={styles.formHalf}>
            <FormControl label="Barcode" helperText="Isi otomatis lewat tombol Scan">
              <Input value={barcode} onChangeText={setBarcode} placeholder="Opsional" keyboardType="numeric" />
            </FormControl>
          </View>
        </HStack>

        <FormControl label="Nama produk" isRequired>
          <Input value={productName} onChangeText={setProductName} placeholder="Nama produk" />
        </FormControl>

        <HStack space="md">
          <View style={styles.formHalf}>
            <FormControl label="Kategori" isRequired>
              <Select
                value={categoryId}
                onChange={setCategoryId}
                placeholder="Pilih kategori"
                options={categories.map((c) => ({ label: c.categoryName, value: c.id }))}
              />
            </FormControl>
          </View>
          <View style={styles.formHalf}>
            <FormControl label="Satuan dasar" isRequired>
              <Select
                value={baseUnitId}
                onChange={setBaseUnitId}
                placeholder="Pilih satuan"
                options={units.map((u) => ({ label: `${u.unitName} (${u.unitCode})`, value: u.id }))}
              />
              {units.length === 0 ? (
                <Link onPress={() => navigation.navigate('Units')} style={styles.unitsLink}>
                  Belum ada — buat dulu
                </Link>
              ) : null}
            </FormControl>
          </View>
        </HStack>

        <FormControl label="Merek">
          <Input value={brand} onChangeText={setBrand} placeholder="Opsional" />
        </FormControl>
        <FormControl label="Deskripsi">
          <TextArea value={description} onChangeText={setDescription} placeholder="Opsional" />
        </FormControl>
        <FormControl label="URL Gambar" helperText="Tempel link gambar produk (belum ada upload langsung dari HP)">
          <Input
            value={imageUrl}
            onChangeText={setImageUrl}
            placeholder="https://..."
            autoCapitalize="none"
            keyboardType="url"
          />
          {imageUrl ? (
            <View style={styles.imagePreviewWrap}>
              <Image source={{ uri: imageUrl }} style={styles.imagePreview} />
            </View>
          ) : null}
        </FormControl>

        <HStack space="md">
          <View style={styles.formHalf}>
            <FormControl label="Harga modal">
              <Input value={costPrice} onChangeText={setCostPrice} placeholder="Opsional" keyboardType="numeric" />
            </FormControl>
          </View>
          <View style={styles.formHalf}>
            <FormControl label="Harga jual" isRequired>
              <Input value={sellingPrice} onChangeText={setSellingPrice} placeholder="0" keyboardType="numeric" />
            </FormControl>
          </View>
        </HStack>

        {editing ? <ProductUnitsSection product={editing} allUnits={units} /> : null}

        {route.params?.prefillBarcode && !editing ? (
          <Text size="xs" color="secondary" style={styles.prefillNote}>
            Barcode {route.params.prefillBarcode} belum terdaftar — lengkapi data di bawah untuk mendaftarkannya
            sebagai produk baru.
          </Text>
        ) : null}

        <Button onPress={onSubmit} loading={submitting} disabled={!canSubmit} fullWidth>
          {editing ? 'Simpan Perubahan' : 'Tambah Produk'}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ProductUnitsSection({ product, allUnits }: { product: Product; allUnits: Unit[] }) {
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
            <View key={u.unitId} style={sectionStyles.row}>
              <View style={sectionStyles.rowInfo}>
                <Text weight="medium">{u.unitName}</Text>
                <Text size="xs" color="secondary">
                  1 {u.unitName} = {u.conversionToBase} {product.baseUnitName}
                </Text>
              </View>
              <View style={sectionStyles.badges}>
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
          style={sectionStyles.addButton}
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
      <Text weight="semibold" size="lg" style={sectionStyles.modalTitle}>
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
      <View style={sectionStyles.checkboxRow}>
        <CheckBox value={saleUnit} onChange={setSaleUnit} label="Bisa dijual (muncul di kasir)" />
      </View>
      <View style={sectionStyles.checkboxRow}>
        <CheckBox value={purchaseUnit} onChange={setPurchaseUnit} label="Bisa dipakai untuk restock" />
      </View>
      <View style={sectionStyles.modalActions}>
        <Button variant="ghost" onPress={onCancel} style={sectionStyles.modalAction}>
          Batal
        </Button>
        <Button onPress={onSubmit} loading={submitting} disabled={!canSubmit} style={sectionStyles.modalAction}>
          Simpan
        </Button>
      </View>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
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

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  formHalf: { flex: 1 },
  unitsLink: { marginTop: spacing.xs },
  imagePreviewWrap: { marginTop: spacing.sm },
  imagePreview: { width: 80, height: 80, borderRadius: 8, backgroundColor: colors.gray[100] },
  prefillNote: { marginBottom: spacing.base },
});
