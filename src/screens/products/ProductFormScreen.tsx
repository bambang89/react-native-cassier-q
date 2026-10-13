import { useEffect, useState } from 'react';
import { Alert, Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCategories } from '@/store/slices/categoriesSlice';
import { fetchUnits } from '@/store/slices/unitsSlice';
import { createProduct, fetchProducts, updateProduct, uploadProductPhoto } from '@/store/slices/productsSlice';
import type { ProductPhotoFile } from '@/api/productsApi';
import { useResponsive } from '@/hooks/useResponsive';
import { choosePhoto } from '@/services/photos/pickPhoto';
import type { RootStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { tabletColors } from '@/theme/tabletColors';
import { Button, FormControl, Input, Link, Select, TextArea } from '@/components/ui/forms';
import { AppBar } from '@/components/ui/recipes';
import { BarcodeIcon } from '@/components/icons/LineIcons';
import { Text } from '@/components/ui/typography';
import { HStack } from '@/components/ui/layout';
import { PriceTiersSection, ProductPhotoGallery, ProductUnitsSection } from './components';
import type { TierDraft } from './components';
import * as productsApi from '@/api/productsApi';
import { apiErrorMessage } from '@/api/errors';
import { generateSku } from './ProductsScreen.utils';
import { usePermissions } from '@/hooks/usePermissions';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductForm'>;

export default function ProductFormScreen({ navigation, route }: Props) {
  const dispatch = useAppDispatch();
  const { isTabletLandscape } = useResponsive();
  const categories = useAppSelector((state) => state.categories.items);
  const units = useAppSelector((state) => state.units.items);
  const editing = route.params?.product;
  const { canCreateProduct, canUpdateProduct } = usePermissions();
  // Hak Akses Menu → Produk → "Atur harga grosir".
  const canEditTiers = usePermissions().can('products.price_tiers');
  // Adding needs products.create, editing needs products.update (Hak Akses Menu).
  const canManageProducts = editing ? canUpdateProduct : canCreateProduct;

  // Kasir/Gudang cannot add or edit products (the API returns 403), so leave the form right away.
  // Bundles are edited in their own form (Kepala Toko only).
  useEffect(() => {
    if (editing?.productType === 'BUNDLE') navigation.replace('BundleForm', { bundle: editing });
  }, [editing, navigation]);

  useEffect(() => {
    if (canManageProducts) return;
    Alert.alert('Akses ditolak', editing ? 'Role Anda tidak diizinkan mengubah produk.' : 'Role Anda tidak diizinkan menambah produk.');
    navigation.goBack();
  }, [canManageProducts, navigation]);

  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [productName, setProductName] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [brand, setBrand] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [pickedImage, setPickedImage] = useState<ProductPhotoFile | null>(null);
  const [baseUnitId, setBaseUnitId] = useState<string | null>(null);
  const [sellingPrice, setSellingPrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [tiers, setTiers] = useState<TierDraft[]>([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchUnits());
  }, [dispatch]);

  useEffect(() => {
    const p = route.params?.product;
    setSku(p?.sku ?? '');
    setBarcode(p?.barcode ?? route.params?.prefillBarcode ?? '');
    setProductName(p?.productName ?? '');
    setCategoryId(p?.categoryId ?? null);
    setBrand(p?.brand ?? '');
    setDescription(p?.description ?? '');
    setImageUrl(p?.imageUrl ?? '');
    setPickedImage(null);
    setBaseUnitId(p?.baseUnitId ?? null);
    setSellingPrice(p?.sellingPrice ? String(p.sellingPrice) : '');
    setCostPrice(p?.costPrice ? String(p.costPrice) : '');
    setTiers((p?.priceTiers ?? []).map((t) => ({ minQuantity: String(t.minQuantity), unitPrice: String(t.unitPrice) })));
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
        barcode: barcode.trim() || undefined,
        productName,
        categoryId,
        brand: brand || undefined,
        description: description || undefined,
        imageUrl: imageUrl || undefined,
        baseUnitId,
        sellingPrice: Number(sellingPrice),
        costPrice: costPrice ? Number(costPrice) : undefined,
      };
      const saved = editing
        ? await dispatch(updateProduct({ id: editing.id, payload })).unwrap()
        : await dispatch(createProduct(payload)).unwrap();

      // Wholesale steps need the products.update permission (Hak Akses Menu).
      if (canEditTiers) {
        const parsed = tiers
          .filter((t) => t.minQuantity !== '' && t.unitPrice !== '')
          .map((t) => ({ minQuantity: Number(t.minQuantity), unitPrice: Number(t.unitPrice) }));
        const before = JSON.stringify(editing?.priceTiers ?? []);
        if (JSON.stringify(parsed) !== before) {
          try {
            await productsApi.updatePriceTiers(saved.id, parsed);
            dispatch(fetchProducts({}));
          } catch (error) {
            Alert.alert('Harga grosir belum tersimpan', apiErrorMessage(error, 'Produk tersimpan, tetapi harga grosir gagal disimpan.'));
            setSubmitting(false);
            return;
          }
        }
      }

      if (pickedImage) {
        try {
          await dispatch(uploadProductPhoto({ id: saved.id, file: pickedImage })).unwrap();
        } catch {
          Alert.alert('Produk tersimpan', 'Tapi foto gagal diupload — coba lagi dari menu edit produk.');
        }
      }

      navigation.goBack();
    } catch (error) {
      // Pesan dari backend (mis. "SKU sudah dipakai", "Barcode sudah dipakai produk lain").
      Alert.alert('Gagal', typeof error === 'string' ? error : 'Produk tidak bisa disimpan. Cek kembali data yang diisi.');
    } finally {
      setSubmitting(false);
    }
  };

  const onOpenCamera = () => {
    choosePhoto(setPickedImage);
  };

  const onRemovePhoto = () => {
    setPickedImage(null);
    setImageUrl('');
  };

  const photoPreviewUri = pickedImage?.uri || imageUrl || null;

  return (
    <KeyboardAvoidingView
      style={[styles.flex, isTabletLandscape && styles.flexTablet]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <AppBar
        title={editing ? 'Ubah Produk' : 'Tambah Produk'}
        onBack={navigation.goBack}
        rightElement={
          <Button
            size="sm"
            variant="outline"
            leftIcon={<BarcodeIcon size={14} color={colors.primary[600]} />}
            onPress={onScan}
          >
            Scan
          </Button>
        }
      />
      <ScrollView
        contentContainerStyle={[styles.body, isTabletLandscape && styles.bodyTablet]}
        keyboardShouldPersistTaps="handled"
      >
        <HStack space="md">
          <View style={styles.formHalf}>
            <FormControl label="SKU" isRequired helperText="Ketik manual atau tekan Auto">
              <Input
                value={sku}
                onChangeText={setSku}
                placeholder="mis. SKU-001"
                autoCapitalize="characters"
                rightElement={
                  <Pressable
                    onPress={() => setSku(generateSku(categories.find((c) => c.id === categoryId)?.categoryName))}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Buat SKU otomatis"
                  >
                    <Text size="sm" weight="semibold" style={styles.skuAuto}>
                      Auto
                    </Text>
                  </Pressable>
                }
              />
            </FormControl>
          </View>
          <View style={styles.formHalf}>
            <FormControl label="Barcode (opsional)" helperText="Kosongkan jika produk tidak punya barcode">
              <Input value={barcode} onChangeText={setBarcode} placeholder="Tanpa barcode" keyboardType="numeric" />
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
        <FormControl label="Foto produk">
          <View style={styles.photoRow}>
            {photoPreviewUri ? (
              <Image source={{ uri: photoPreviewUri }} style={styles.imagePreview} />
            ) : (
              <View style={[styles.imagePreview, styles.imagePlaceholder]}>
                <Text size="xs" color="muted" align="center">
                  Belum ada foto
                </Text>
              </View>
            )}
            <View style={styles.photoActions}>
              <Button size="sm" variant="outline" onPress={onOpenCamera}>
                {photoPreviewUri ? 'Ganti Foto' : 'Ambil Foto'}
              </Button>
              {photoPreviewUri ? (
                <Button size="sm" variant="ghost" onPress={onRemovePhoto}>
                  Hapus
                </Button>
              ) : null}
            </View>
          </View>
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

        <PriceTiersSection
          tiers={tiers}
          onChange={setTiers}
          normalPrice={Number(sellingPrice || 0)}
          unitName={units.find((u) => u.id === baseUnitId)?.unitName ?? 'pcs'}
          disabled={!canEditTiers}
        />

        {editing ? <ProductPhotoGallery productId={editing.id} /> : null}

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

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  flexTablet: { backgroundColor: tabletColors.gray25 },
  body: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  bodyTablet: { maxWidth: 760, width: '100%', alignSelf: 'center', paddingVertical: 22, paddingHorizontal: 24 },
  formHalf: { flex: 1 },
  skuAuto: { color: colors.primary[600] },
  unitsLink: { marginTop: spacing.xs },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  imagePreview: { width: 72, height: 72, borderRadius: 8, backgroundColor: colors.gray[100] },
  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', padding: spacing.xs },
  photoActions: { flexDirection: 'row', gap: spacing.sm },
  prefillNote: { marginBottom: spacing.base },
});
