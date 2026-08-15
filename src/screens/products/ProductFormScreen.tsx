import { useEffect, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import * as productsApi from '../../api/productsApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchCategories } from '../../store/slices/categoriesSlice';
import type { RootStackParamList } from '../../navigation/types';
import { spacing } from '../../theme';
import { Button, FormControl, Input, Select, TextArea } from '../../components/ui/forms';
import { AppBar } from '../../components/ui/recipes';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductForm'>;

export default function ProductFormScreen({ navigation, route }: Props) {
  const dispatch = useAppDispatch();
  const categories = useAppSelector((state) => state.categories.items);
  const editing = route.params?.product;

  const [sku, setSku] = useState(editing?.sku ?? '');
  const [barcode, setBarcode] = useState(editing?.barcode ?? '');
  const [productName, setProductName] = useState(editing?.productName ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(editing?.categoryId ?? null);
  const [brand, setBrand] = useState(editing?.brand ?? '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [baseUnitId, setBaseUnitId] = useState(editing?.baseUnitId ?? '');
  const [sellingPrice, setSellingPrice] = useState(editing?.sellingPrice ? String(editing.sellingPrice) : '');
  const [costPrice, setCostPrice] = useState(editing?.costPrice ? String(editing.costPrice) : '');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const canSubmit = !!(sku && productName && categoryId && baseUnitId && sellingPrice);

  const onSubmit = async () => {
    if (!categoryId) return;
    setSubmitting(true);
    try {
      const payload = {
        sku,
        barcode: barcode || undefined,
        productName,
        categoryId,
        brand: brand || undefined,
        description: description || undefined,
        baseUnitId,
        sellingPrice: Number(sellingPrice),
        costPrice: costPrice ? Number(costPrice) : undefined,
      };
      if (editing) {
        await productsApi.updateProduct(editing.id, payload);
      } else {
        await productsApi.createProduct(payload);
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
      <AppBar title={editing ? 'Ubah Produk' : 'Tambah Produk'} onBack={navigation.goBack} />
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <FormControl label="SKU" isRequired>
          <Input value={sku} onChangeText={setSku} placeholder="mis. SKU-001" autoCapitalize="characters" />
        </FormControl>
        <FormControl label="Barcode">
          <Input value={barcode} onChangeText={setBarcode} placeholder="Opsional" keyboardType="numeric" />
        </FormControl>
        <FormControl label="Nama produk" isRequired>
          <Input value={productName} onChangeText={setProductName} placeholder="Nama produk" />
        </FormControl>
        <FormControl label="Kategori" isRequired>
          <Select
            value={categoryId}
            onChange={setCategoryId}
            placeholder="Pilih kategori"
            options={categories.map((c) => ({ label: c.categoryName, value: c.id }))}
          />
        </FormControl>
        <FormControl label="Merek">
          <Input value={brand} onChangeText={setBrand} placeholder="Opsional" />
        </FormControl>
        <FormControl label="Deskripsi">
          <TextArea value={description} onChangeText={setDescription} placeholder="Opsional" />
        </FormControl>
        <FormControl
          label="ID Satuan dasar (UUID)"
          isRequired
          helperText="Backend belum punya daftar satuan lewat API — salin UUID satuan (pcs/box/dll) dari admin/database."
        >
          <Input value={baseUnitId} onChangeText={setBaseUnitId} placeholder="uuid satuan" autoCapitalize="none" />
        </FormControl>
        <FormControl label="Harga jual" isRequired>
          <Input value={sellingPrice} onChangeText={setSellingPrice} placeholder="0" keyboardType="numeric" />
        </FormControl>
        <FormControl label="Harga modal">
          <Input value={costPrice} onChangeText={setCostPrice} placeholder="Opsional" keyboardType="numeric" />
        </FormControl>

        <Button onPress={onSubmit} loading={submitting} disabled={!canSubmit} fullWidth>
          {editing ? 'Simpan Perubahan' : 'Tambah Produk'}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  body: { padding: spacing.base, paddingBottom: spacing['3xl'] },
});
