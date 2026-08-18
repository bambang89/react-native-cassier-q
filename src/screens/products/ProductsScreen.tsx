import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteProduct, fetchProducts, restockProduct, setSearch } from '@/store/slices/productsSlice';
import { fetchProductUnits } from '@/store/slices/productUnitsSlice';
import { fetchCategories } from '@/store/slices/categoriesSlice';
import { fetchStoreProfile } from '@/store/slices/storeProfileSlice';
import { resolvePurchaseUnitChoices } from '@/utils/productUnits';
import { emojiForProduct, paletteColorFor } from '@/utils/productDisplay';
import { useResponsive } from '@/hooks/useResponsive';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import type { Product } from '@/types/models';
import { colors, spacing } from '@/theme';
import { Button, FormControl, Input, Link, Pressable, Select } from '@/components/ui/forms';
import { Badge } from '@/components/ui/dataDisplay';
import type { BadgeVariant } from '@/components/ui/dataDisplay';
import { AlertDialog, Modal } from '@/components/ui/overlay';
import { Card, EmptyState, Header, SwipeList, TabletTopBar } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { PlusIcon, SearchIcon } from '@/components/icons/LineIcons';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Products'>,
  NativeStackScreenProps<RootStackParamList>
>;

// Sama dengan ambang di layar Kasir — dipakai buat badge stok & banner peringatan di sini.
const LOW_STOCK_THRESHOLD = 5;

export default function ProductsScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { isTabletLandscape } = useResponsive();
  const { items, search, page, totalPages, status } = useAppSelector((state) => state.products);
  const categories = useAppSelector((state) => state.categories.items);
  const user = useAppSelector((state) => state.auth.user);
  const storeProfile = useAppSelector((state) => state.storeProfile.profile);
  const [searchDraft, setSearchDraft] = useState(search);
  const [restockTarget, setRestockTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const allPagesLoaded = totalPages === 0 || page + 1 >= totalPages;
  const lowStockCount = useMemo(
    () => items.filter((p) => p.stockQuantity <= LOW_STOCK_THRESHOLD).length,
    [items],
  );
  const gridProducts = useMemo(
    () => (selectedCategoryId ? items.filter((p) => p.categoryId === selectedCategoryId) : items),
    [items, selectedCategoryId],
  );
  const primaryRole = user?.roles?.[0] ?? null;
  const storeName = storeProfile?.storeName ?? primaryRole?.storeName ?? '-';

  useEffect(() => {
    dispatch(fetchProducts({ search }));
  }, [dispatch, search]);

  useEffect(() => {
    dispatch(fetchCategories());
    dispatch(fetchStoreProfile());
  }, [dispatch]);

  const onSearchSubmit = () => {
    dispatch(setSearch(searchDraft.trim()));
  };

  const onScanSearch = () => {
    navigation.navigate('Scanner', {
      onFound: (product) => {
        const term = product.barcode ?? product.sku;
        setSearchDraft(term);
        dispatch(setSearch(term));
      },
      onNotFound: (barcode) => {
        setSearchDraft(barcode);
        dispatch(setSearch(barcode));
      },
    });
  };

  const onLoadMore = () => {
    if (status === 'loading' || page + 1 >= totalPages) return;
    dispatch(fetchProducts({ search, page: page + 1 }));
  };

  const onDelete = async (product: Product) => {
    try {
      await dispatch(deleteProduct(product.id)).unwrap();
      setDeleteTarget(null);
    } catch {
      Alert.alert('Gagal', 'Produk tidak bisa dinonaktifkan, coba lagi.');
    }
  };

  const lowStockBanner =
    lowStockCount > 0 ? (
      <View style={styles.lowStockBanner}>
        <Text size="lg">⚠️</Text>
        <Text size="sm" weight="semibold" color="warning" style={styles.lowStockBannerText}>
          {lowStockCount} produk{allPagesLoaded ? '' : ' (dari yang termuat)'} stoknya di bawah minimum ({LOW_STOCK_THRESHOLD}). Yuk restock sebelum kehabisan.
        </Text>
      </View>
    ) : null;

  if (isTabletLandscape) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
        <TabletTopBar
          title="Produk"
          subtitle={`${items.length} produk`}
          storeName={storeName}
          userName={user?.name ?? 'Kasir'}
          rightAction={
            <Button
              size="sm"
              leftIcon={<PlusIcon size={14} color={colors.white} />}
              onPress={() => navigation.navigate('ProductForm', { product: undefined })}
            >
              Tambah
            </Button>
          }
        />

        {lowStockBanner}

        <View style={styles.tabletBody}>
          <View style={styles.tabletSearchRow}>
            <Input
              placeholder="Cari produk atau SKU"
              value={searchDraft}
              onChangeText={setSearchDraft}
              onSubmitEditing={onSearchSubmit}
              returnKeyType="search"
              leftElement={<SearchIcon size={16} color={colors.text.muted} />}
              style={styles.tabletSearchInput}
            />
          </View>

          {categories.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryRow}
            >
              <CategoryChip
                label="Semua"
                active={selectedCategoryId === null}
                onPress={() => setSelectedCategoryId(null)}
              />
              {categories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  label={cat.categoryName}
                  active={selectedCategoryId === cat.id}
                  onPress={() => setSelectedCategoryId(cat.id)}
                />
              ))}
            </ScrollView>
          ) : null}

          <FlatList
            data={gridProducts}
            keyExtractor={(item) => item.id}
            numColumns={4}
            columnWrapperStyle={styles.gridRow}
            contentContainerStyle={styles.grid}
            onRefresh={() => dispatch(fetchProducts({ search }))}
            refreshing={status === 'loading' && page === 0}
            onEndReached={onLoadMore}
            onEndReachedThreshold={0.4}
            renderItem={({ item }) => (
              <ProductTile item={item} onPress={() => navigation.navigate('ProductForm', { product: item })} />
            )}
            ListEmptyComponent={
              status === 'loading' ? (
                <Text color="muted" align="center" style={styles.empty}>
                  Memuat produk...
                </Text>
              ) : search || selectedCategoryId ? (
                <EmptyState icon="🔍" title="Produk tidak ditemukan" description="Coba kata kunci atau kategori lain." />
              ) : (
                <EmptyState
                  icon="📦"
                  title="Belum Ada Produk"
                  description="Yuk tambahkan produk pertamamu supaya bisa langsung mulai jualan di kasir."
                  actionLabel="+ Tambah Produk"
                  onAction={() => navigation.navigate('ProductForm', { product: undefined })}
                />
              )
            }
          />
        </View>

        <Modal isOpen={!!restockTarget} onClose={() => setRestockTarget(null)}>
          {restockTarget ? (
            <RestockForm
              product={restockTarget}
              onDone={() => setRestockTarget(null)}
              onCancel={() => setRestockTarget(null)}
            />
          ) : null}
        </Modal>

        <AlertDialog
          isOpen={!!deleteTarget}
          onClose={() => setDeleteTarget(null)}
          title="Nonaktifkan produk?"
          description={`"${deleteTarget?.productName}" tidak akan muncul lagi di daftar produk/kasir.`}
          confirmText="Nonaktifkan"
          isDanger
          onConfirm={() => deleteTarget && onDelete(deleteTarget)}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header
        title="Produk"
        rightElement={
          <View style={styles.headerActions}>
            <Link onPress={() => navigation.navigate('Categories')}>Kategori</Link>
            <Link onPress={() => navigation.navigate('Units')}>Satuan</Link>
            <Button size="sm" onPress={() => navigation.navigate('ProductForm', { product: undefined })}>
              + Tambah
            </Button>
          </View>
        }
      />

      {lowStockBanner}

      <View style={styles.searchBar}>
        <Input
          placeholder="Cari nama, SKU, atau barcode..."
          value={searchDraft}
          onChangeText={setSearchDraft}
          onSubmitEditing={onSearchSubmit}
          returnKeyType="search"
          rightElement={
            <Pressable onPress={onScanSearch} hitSlop={8} accessibilityLabel="Cari lewat scan barcode">
              <Text size="lg">📷</Text>
            </Pressable>
          }
        />
      </View>

      <SwipeList
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={() => dispatch(fetchProducts({ search }))}
        refreshing={status === 'loading' && page === 0}
        onEndReached={onLoadMore}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.list}
        rightActions={(item) => [
          { label: 'Restock', onPress: () => setRestockTarget(item), color: colors.primary[600] },
          { label: 'Hapus', onPress: () => setDeleteTarget(item) },
        ]}
        renderItem={(item) => (
          <Card
            onPress={() => navigation.navigate('ProductForm', { product: item })}
            style={styles.card}
            shadow="none"
          >
            <View style={styles.row}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={styles.rowImage} />
              ) : (
                <View style={styles.rowImagePlaceholder} />
              )}
              <View style={styles.info}>
                <Text weight="semibold" numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text size="xs" color="secondary">
                  {item.sku} · {item.categoryName}
                </Text>
              </View>
              <View style={styles.right}>
                <Text weight="bold" color="link">
                  Rp {item.sellingPrice.toLocaleString('id-ID')}
                </Text>
                <Badge
                  variant={
                    item.stockQuantity <= 0
                      ? 'error'
                      : item.stockQuantity <= LOW_STOCK_THRESHOLD
                        ? 'warning'
                        : 'neutral'
                  }
                >
                  {`${item.stockQuantity} ${item.baseUnitName}`}
                </Badge>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          status === 'loading' ? (
            <Text color="muted" align="center" style={styles.empty}>
              Memuat produk...
            </Text>
          ) : search ? (
            <EmptyState
              icon="🔍"
              title="Produk tidak ditemukan"
              description={`Tidak ada produk yang cocok dengan "${search}". Coba kata kunci lain, atau scan barcode-nya langsung.`}
            />
          ) : (
            <EmptyState
              icon="📦"
              title="Belum Ada Produk"
              description="Yuk tambahkan produk pertamamu supaya bisa langsung mulai jualan di kasir."
              actionLabel="+ Tambah Produk"
              onAction={() => navigation.navigate('ProductForm', { product: undefined })}
            />
          )
        }
      />

      <Modal isOpen={!!restockTarget} onClose={() => setRestockTarget(null)}>
        {restockTarget ? (
          <RestockForm
            product={restockTarget}
            onDone={() => setRestockTarget(null)}
            onCancel={() => setRestockTarget(null)}
          />
        ) : null}
      </Modal>

      <AlertDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Nonaktifkan produk?"
        description={`"${deleteTarget?.productName}" tidak akan muncul lagi di daftar produk/kasir.`}
        confirmText="Nonaktifkan"
        isDanger
        onConfirm={() => deleteTarget && onDelete(deleteTarget)}
      />
    </SafeAreaView>
  );
}

function CategoryChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text size="sm" weight="semibold" color={active ? 'inverse' : 'secondary'}>
        {label}
      </Text>
    </Pressable>
  );
}

function stockStatus(product: Product): { label: string; variant: BadgeVariant } {
  if (product.stockQuantity <= 0) return { label: 'Habis', variant: 'error' };
  if (product.stockQuantity <= LOW_STOCK_THRESHOLD) return { label: 'Menipis', variant: 'warning' };
  return { label: 'Aman', variant: 'success' };
}

function ProductTile({ item, onPress }: { item: Product; onPress: () => void }) {
  const thumbnailColor = paletteColorFor(item.id);
  const badge = stockStatus(item);
  return (
    <Card padding="none" style={styles.tile} onPress={onPress}>
      <View style={[styles.tileImageWrap, !item.imageUrl && { backgroundColor: thumbnailColor }]}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.tileImage} />
        ) : (
          <Text size="2xl">{emojiForProduct(item)}</Text>
        )}
      </View>
      <View style={styles.tileBody}>
        <Text weight="semibold" size="xs" numberOfLines={2} style={styles.tileName}>
          {item.productName}
        </Text>
        <Text weight="bold" size="sm">
          Rp {item.sellingPrice.toLocaleString('id-ID')}
        </Text>
        <Badge variant={badge.variant}>{badge.label}</Badge>
      </View>
    </Card>
  );
}

function RestockForm({
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
  container: { flex: 1, backgroundColor: colors.background },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.base },
  lowStockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.warning[200],
    backgroundColor: colors.warning[50],
  },
  lowStockBannerText: { flex: 1 },
  searchBar: { paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing['2xl'] },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowImage: { width: 40, height: 40, borderRadius: 6, marginRight: spacing.sm, backgroundColor: colors.gray[100] },
  rowImagePlaceholder: { width: 40, height: 40, borderRadius: 6, marginRight: spacing.sm, backgroundColor: colors.gray[100] },
  info: { flex: 1, marginRight: spacing.sm },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  empty: { marginTop: spacing['3xl'] },
  modalTitle: { marginBottom: spacing.base },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { minWidth: 90 },
  tabletBody: { flex: 1, paddingHorizontal: spacing.base },
  tabletSearchRow: { marginBottom: spacing.sm },
  tabletSearchInput: { flex: 1 },
  categoryRow: { paddingBottom: spacing.sm, gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  chipActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  grid: { paddingBottom: spacing['2xl'] },
  gridRow: { gap: spacing.md },
  tile: { flex: 1, minHeight: 160, marginBottom: spacing.md, overflow: 'hidden' },
  tileImageWrap: {
    width: '100%',
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  tileImage: { width: '100%', height: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  tileBody: { padding: spacing.sm, gap: spacing.xs },
  tileName: { minHeight: 32 },
});
