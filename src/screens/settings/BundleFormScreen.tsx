import { useEffect, useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as bundlesApi from '@/api/bundlesApi';
import * as productsApi from '@/api/productsApi';
import { apiErrorMessage } from '@/api/errors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCategories } from '@/store/slices/categoriesSlice';
import { fetchProducts } from '@/store/slices/productsSlice';
import { useMenuAccess } from '@/navigation/menuCatalog';
import type { RootStackParamList } from '@/navigation/types';
import type { Product, ProductUnit } from '@/types/models';
import { isBundle } from '@/utils/bundles';
import { generateSku } from '@/screens/products/ProductsScreen.utils';
import { colors, radii, spacing } from '@/theme';
import { Button, FormControl, Input, Pressable, Select, TextArea } from '@/components/ui/forms';
import { AlertDialog, Modal } from '@/components/ui/overlay';
import { AppBar, EmptyState } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { BoxIcon, PlusIcon, SearchIcon, TrashIcon } from '@/components/icons/LineIcons';

import { rupiah } from './promoUtils';

type Props = NativeStackScreenProps<RootStackParamList, 'BundleForm'>;

/** One item being edited inside the bundle. */
type DraftItem = {
  productId: string;
  productName: string;
  unitId: string;
  unitName: string;
  conversionToBase: number;
  quantity: number;
  /** Selling price per base unit of the item (for the "harga normal" comparison). */
  basePrice: number;
  stockBase: number;
  units: ProductUnit[];
};

/** Create or edit a bundle (Kepala Toko only). */
export default function BundleFormScreen({ navigation, route }: Props) {
  const dispatch = useAppDispatch();
  const insets = useSafeAreaInsets();
  const { isManager } = useMenuAccess();
  const editing = route.params?.bundle;
  const categories = useAppSelector((state) => state.categories.items);

  const [name, setName] = useState(editing?.productName ?? '');
  const [sku, setSku] = useState(editing?.sku ?? '');
  const [barcode, setBarcode] = useState(editing?.barcode ?? '');
  const [categoryId, setCategoryId] = useState<string | null>(editing?.categoryId ?? null);
  const [price, setPrice] = useState(editing ? String(editing.sellingPrice) : '');
  const [description, setDescription] = useState(editing?.description ?? '');
  const [items, setItems] = useState<DraftItem[]>([]);
  const [catalog, setCatalog] = useState<Product[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    dispatch(fetchCategories());
    productsApi
      .fetchProducts({ size: 500 })
      .then((page) => setCatalog(page.content.filter((p) => !isBundle(p) && p.status === 'ACTIVE')))
      .catch(() => setCatalog([]));
  }, [dispatch]);

  // Editing: rebuild the item rows once the catalog (prices) is loaded.
  useEffect(() => {
    if (!editing?.bundleItems || catalog.length === 0 || items.length > 0) return;
    Promise.all(
      editing.bundleItems.map(async (b) => {
        const product = catalog.find((p) => p.id === b.productId);
        const units = await productsApi.fetchProductUnits(b.productId).catch(() => []);
        const unit = units.find((u) => u.unitId === b.unitId);
        return {
          productId: b.productId,
          productName: b.productName,
          unitId: b.unitId,
          unitName: b.unitName,
          conversionToBase: unit?.conversionToBase ?? (b.quantity ? b.quantityBase / b.quantity : 1),
          quantity: Number(b.quantity),
          basePrice: product?.sellingPrice ?? 0,
          stockBase: b.stockBase,
          units,
        } satisfies DraftItem;
      }),
    ).then(setItems);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catalog, editing]);

  const normalPrice = items.reduce((sum, i) => sum + i.basePrice * i.conversionToBase * i.quantity, 0);
  const bundlePrice = Number(price || 0);
  const saving_ = normalPrice - bundlePrice;
  const savingPercent = normalPrice > 0 ? Math.round((saving_ / normalPrice) * 100) : 0;
  const available = items.length
    ? Math.max(0, Math.min(...items.map((i) => Math.floor(i.stockBase / (i.conversionToBase * i.quantity || 1)))))
    : 0;

  const pickerResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    return catalog
      .filter((p) => p.id !== editing?.id && !items.some((i) => i.productId === p.id))
      .filter((p) => !q || p.productName.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .slice(0, 40);
  }, [catalog, search, items, editing?.id]);

  const canSubmit = name.trim() && sku.trim() && categoryId && price !== '' && items.length > 0;

  /** Adds a product to the bundle with its base unit and quantity 1. */
  const addItem = async (product: Product) => {
    setPickerOpen(false);
    setSearch('');
    const units = await productsApi.fetchProductUnits(product.id).catch(() => []);
    const base = units.find((u) => u.baseUnit) ?? units[0];
    setItems((prev) => [
      ...prev,
      {
        productId: product.id,
        productName: product.productName,
        unitId: base?.unitId ?? product.baseUnitId,
        unitName: base?.unitName ?? product.baseUnitName,
        conversionToBase: base?.conversionToBase ?? 1,
        quantity: 1,
        basePrice: product.sellingPrice,
        stockBase: product.stockQuantity,
        units,
      },
    ]);
  };

  /** Updates one item row. */
  const patchItem = (productId: string, patch: Partial<DraftItem>) =>
    setItems((prev) => prev.map((i) => (i.productId === productId ? { ...i, ...patch } : i)));

  /** Saves the bundle and returns to the list. */
  const onSave = async () => {
    if (!categoryId) return;
    setSaving(true);
    const payload = {
      sku: sku.trim(),
      barcode: barcode.trim() || undefined,
      productName: name.trim(),
      categoryId,
      description: description.trim() || undefined,
      sellingPrice: bundlePrice,
      items: items.map((i) => ({ productId: i.productId, unitId: i.unitId, quantity: i.quantity })),
    };
    try {
      if (editing) await bundlesApi.updateBundle(editing.id, payload);
      else await bundlesApi.createBundle(payload);
      dispatch(fetchProducts({}));
      navigation.goBack();
    } catch (error) {
      Alert.alert('Gagal', apiErrorMessage(error, 'Paket tidak bisa disimpan.'));
    } finally {
      setSaving(false);
    }
  };

  /** Deletes the bundle (soft delete on the server). */
  const onDelete = async () => {
    if (!editing) return;
    try {
      await bundlesApi.deleteBundle(editing.id);
      setConfirmDelete(false);
      dispatch(fetchProducts({}));
      navigation.goBack();
    } catch (error) {
      Alert.alert('Gagal', apiErrorMessage(error, 'Paket tidak bisa dihapus.'));
    }
  };

  if (!isManager) {
    return (
      <View style={local.container}>
        <AppBar title="Paket Bundling" onBack={navigation.goBack} />
        <EmptyState icon={BoxIcon} title="Khusus Kepala Toko" description="Hanya Kepala Toko yang bisa membuat atau mengubah paket." />
      </View>
    );
  }

  return (
    <View style={local.container}>
      <AppBar title={editing ? 'Ubah Paket' : 'Paket Baru'} onBack={navigation.goBack} />
      <KeyboardAvoidingView style={local.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={local.body} keyboardShouldPersistTaps="handled">
          {/* Ringkasan */}
          <View style={local.hero}>
            <Text size="xs" weight="semibold" style={local.heroLabel}>
              {name.trim() ? name.trim().toUpperCase() : 'PAKET BARU'}
            </Text>
            <Text style={local.heroPrice}>{rupiah(bundlePrice)}</Text>
            <View style={local.heroRow}>
              <View style={local.heroStat}>
                <Text size="xs" style={local.heroMuted}>
                  Harga normal
                </Text>
                <Text weight="semibold" style={[local.heroValue, normalPrice > bundlePrice && local.strike]}>
                  {rupiah(normalPrice)}
                </Text>
              </View>
              <View style={local.heroStat}>
                <Text size="xs" style={local.heroMuted}>
                  Pembeli hemat
                </Text>
                <Text weight="semibold" style={saving_ > 0 ? local.heroSave : local.heroValue}>
                  {saving_ > 0 ? `${rupiah(saving_)} (${savingPercent}%)` : '-'}
                </Text>
              </View>
              <View style={local.heroStat}>
                <Text size="xs" style={local.heroMuted}>
                  Bisa dijual
                </Text>
                <Text weight="semibold" style={local.heroValue}>
                  {items.length ? `${available} paket` : '-'}
                </Text>
              </View>
            </View>
          </View>

          {/* Isi paket */}
          <SectionCard title={`Isi paket (${items.length})`}>
            {items.length === 0 ? (
              <Text size="sm" color="muted" style={local.emptyItems}>
                Belum ada isi. Tambahkan produk yang akan digabung dalam paket ini.
              </Text>
            ) : (
              items.map((item, index) => (
                <View key={item.productId} style={[local.itemRow, index > 0 && local.itemDivider]}>
                  <View style={local.itemTop}>
                    <View style={local.flex}>
                      <Text weight="semibold" numberOfLines={1}>
                        {item.productName}
                      </Text>
                      <Text size="xs" color="muted">
                        {rupiah(item.basePrice * item.conversionToBase)} / {item.unitName} · stok {item.stockBase}
                      </Text>
                    </View>
                    <Pressable
                      onPress={() => setItems((prev) => prev.filter((i) => i.productId !== item.productId))}
                      hitSlop={8}
                      accessibilityLabel={`Hapus ${item.productName}`}
                      style={local.removeButton}
                    >
                      <TrashIcon size={15} color={colors.error[600]} />
                    </Pressable>
                  </View>
                  <View style={local.itemControls}>
                    <View style={local.unitChips}>
                      {(item.units.length ? item.units : [{ unitId: item.unitId, unitName: item.unitName, conversionToBase: item.conversionToBase } as ProductUnit]).map((u) => {
                        const active = u.unitId === item.unitId;
                        return (
                          <Pressable
                            key={u.unitId}
                            onPress={() =>
                              patchItem(item.productId, { unitId: u.unitId, unitName: u.unitName, conversionToBase: u.conversionToBase })
                            }
                            style={[local.unitChip, active && local.unitChipActive]}
                          >
                            <Text size="xs" weight="semibold" style={active ? local.unitTextActive : local.unitText}>
                              {u.unitName}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    <View style={local.stepper}>
                      <Pressable
                        onPress={() => patchItem(item.productId, { quantity: Math.max(1, item.quantity - 1) })}
                        style={local.stepButton}
                        accessibilityLabel="Kurangi"
                      >
                        <Text weight="bold" style={local.stepText}>
                          −
                        </Text>
                      </Pressable>
                      <TextInput
                        value={String(item.quantity)}
                        onChangeText={(v) => patchItem(item.productId, { quantity: Math.max(1, Number(v.replace(/\D/g, '')) || 1) })}
                        keyboardType="number-pad"
                        style={local.stepInput}
                      />
                      <Pressable
                        onPress={() => patchItem(item.productId, { quantity: item.quantity + 1 })}
                        style={local.stepButton}
                        accessibilityLabel="Tambah"
                      >
                        <Text weight="bold" style={local.stepText}>
                          +
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              ))
            )}
            <Button variant="outline" leftIcon={<PlusIcon size={15} color={colors.primary[600]} />} onPress={() => setPickerOpen(true)} style={local.addItem}>
              Tambah Produk ke Paket
            </Button>
          </SectionCard>

          {/* Detail */}
          <SectionCard title="Detail paket">
            <FormControl label="Nama paket" isRequired>
              <Input value={name} onChangeText={setName} placeholder="Mis. Paket Sarapan" maxLength={200} />
            </FormControl>
            <FormControl label="Harga paket (Rp)" isRequired helperText={normalPrice > 0 ? `Harga normal isinya ${rupiah(normalPrice)}` : undefined}>
              <Input value={price} onChangeText={(v) => setPrice(v.replace(/\D/g, ''))} keyboardType="number-pad" placeholder="25000" />
            </FormControl>
            <FormControl label="Kategori" isRequired>
              <Select
                value={categoryId}
                onChange={setCategoryId}
                placeholder="Pilih kategori"
                options={categories.map((c) => ({ label: c.categoryName, value: c.id }))}
              />
            </FormControl>
            <View style={local.row}>
              <View style={local.flex}>
                <FormControl label="SKU" isRequired>
                  <Input
                    value={sku}
                    onChangeText={(v) => setSku(v.toUpperCase())}
                    autoCapitalize="characters"
                    placeholder="PKT-001"
                    rightElement={
                      <Pressable
                        onPress={() => setSku(generateSku('PKT'))}
                        hitSlop={8}
                        accessibilityLabel="Buat SKU otomatis"
                      >
                        <Text size="xs" weight="bold" style={local.autoText}>
                          Auto
                        </Text>
                      </Pressable>
                    }
                  />
                </FormControl>
              </View>
              <View style={local.flex}>
                <FormControl label="Barcode">
                  <Input value={barcode} onChangeText={setBarcode} placeholder="Opsional" keyboardType="numeric" />
                </FormControl>
              </View>
            </View>
            <FormControl label="Deskripsi">
              <TextArea value={description} onChangeText={setDescription} placeholder="Opsional" />
            </FormControl>
          </SectionCard>

          {editing ? (
            <Button variant="dangerOutline" onPress={() => setConfirmDelete(true)}>
              Hapus Paket
            </Button>
          ) : null}
        </ScrollView>

        <View style={[local.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
          <Button fullWidth onPress={onSave} loading={saving} disabled={!canSubmit || saving}>
            {editing ? 'Simpan Perubahan' : 'Buat Paket'}
          </Button>
        </View>
      </KeyboardAvoidingView>

      <Modal isOpen={pickerOpen} onClose={() => setPickerOpen(false)}>
        <Text weight="bold" size="lg" style={local.pickerTitle}>
          Pilih produk isi paket
        </Text>
        <View style={local.searchBox}>
          <SearchIcon size={16} color={colors.text.muted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Cari nama atau SKU"
            placeholderTextColor={colors.gray[400]}
            autoCorrect={false}
            style={local.searchInput}
          />
        </View>
        <ScrollView style={local.pickerList} keyboardShouldPersistTaps="handled">
          {pickerResults.length === 0 ? (
            <Text size="sm" color="muted" align="center" style={local.emptyItems}>
              Produk tidak ditemukan
            </Text>
          ) : (
            pickerResults.map((p) => (
              <Pressable key={p.id} onPress={() => addItem(p)} style={local.pickerRow}>
                <View style={local.flex}>
                  <Text weight="semibold" numberOfLines={1}>
                    {p.productName}
                  </Text>
                  <Text size="xs" color="muted">
                    {p.sku} · stok {p.stockQuantity} {p.baseUnitName}
                  </Text>
                </View>
                <Text size="sm" weight="semibold" style={local.price}>
                  {rupiah(p.sellingPrice)}
                </Text>
              </Pressable>
            ))
          )}
        </ScrollView>
      </Modal>

      <AlertDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Hapus paket?"
        description={`"${editing?.productName}" tidak akan muncul lagi di kasir. Stok produk isinya tidak berubah.`}
        confirmText="Hapus"
        isDanger
        onConfirm={onDelete}
      />
    </View>
  );
}

/** Card with a small uppercase title grouping related fields. */
function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={local.section}>
      <Text size="xs" weight="semibold" color="muted" style={local.sectionTitle}>
        {title.toUpperCase()}
      </Text>
      <View style={local.card}>{children}</View>
    </View>
  );
}

const local = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  body: { padding: spacing.base, paddingBottom: spacing.xl, gap: spacing.lg },
  hero: { padding: spacing.lg, borderRadius: radii.xl, backgroundColor: colors.darkBg, gap: 2 },
  heroLabel: { color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  heroPrice: { color: colors.white, fontSize: 30, lineHeight: 38, fontWeight: '800' },
  heroRow: {
    flexDirection: 'row',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  heroStat: { flex: 1, gap: 2 },
  heroMuted: { color: 'rgba(255,255,255,0.6)' },
  heroValue: { color: colors.white },
  heroSave: { color: '#7EE2B8' },
  strike: { textDecorationLine: 'line-through', color: 'rgba(255,255,255,0.7)' },
  section: { gap: spacing.sm },
  sectionTitle: { letterSpacing: 0.8, marginLeft: spacing.xs },
  card: { padding: spacing.base, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  emptyItems: { paddingVertical: spacing.md },
  itemRow: { paddingVertical: spacing.md, gap: spacing.sm },
  itemDivider: { borderTopWidth: 1, borderTopColor: colors.gray[100] },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error[50],
  },
  itemControls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  unitChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, flex: 1 },
  unitChip: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: 9999, borderWidth: 1, borderColor: colors.border },
  unitChipActive: { borderColor: colors.primary[600], backgroundColor: colors.primary[50] },
  unitText: { color: colors.text.secondary },
  unitTextActive: { color: colors.primary[700] },
  stepper: { flexDirection: 'row', alignItems: 'center', borderRadius: radii.md, borderWidth: 1, borderColor: colors.border },
  stepButton: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  stepText: { fontSize: 18, color: colors.primary[600] },
  stepInput: { width: 40, textAlign: 'center', fontSize: 15, fontWeight: '700', color: colors.text.primary },
  addItem: { marginTop: spacing.sm },
  row: { flexDirection: 'row', gap: spacing.md },
  autoText: { color: colors.primary[600] },
  price: { color: colors.primary[700] },
  footer: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  pickerTitle: { marginBottom: spacing.md },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: 15, color: colors.text.primary },
  pickerList: { maxHeight: 360 },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray[100],
  },
});
