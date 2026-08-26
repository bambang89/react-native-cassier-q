import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteProduct, fetchProducts, setSearch } from '@/store/slices/productsSlice';
import { fetchCategories } from '@/store/slices/categoriesSlice';
import { fetchStoreProfile } from '@/store/slices/storeProfileSlice';
import { LOW_STOCK_THRESHOLD } from '@/utils/productDisplay';
import { useResponsive } from '@/hooks/useResponsive';
import type { Product } from '@/types/models';
import { colors } from '@/theme';
import { tabletColors } from '@/theme/tabletColors';
import { Button, Input, Link, Pressable } from '@/components/ui/forms';
import { AlertDialog, Modal } from '@/components/ui/overlay';
import { EmptyState, Header, SwipeList, TabletTopBar } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { AlertTriangleIcon, BarcodeIcon, BoxIcon, PlusIcon, SearchIcon } from '@/components/icons/LineIcons';
import { CategoryChip, ProductGridCard } from '@/components/product';

import type { ProductsScreenProps } from './ProductsScreen.types';
import { styles } from './ProductsScreen.styles';
import { ProductListItem, RestockForm } from './components';

export default function ProductsScreen({ navigation }: ProductsScreenProps) {
  const dispatch = useAppDispatch();
  const { isTabletLandscape } = useResponsive();
  const { items, search, page, totalPages, status, error } = useAppSelector((state) => state.products);
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
        <View style={styles.lowStockGlyph}>
          <AlertTriangleIcon size={18} color={colors.warning[600]} />
        </View>
        <Text size="sm" weight="semibold" color="warning" style={styles.lowStockBannerText}>
          {lowStockCount} produk{allPagesLoaded ? '' : ' (dari yang termuat)'} stoknya di bawah minimum ({LOW_STOCK_THRESHOLD}). Yuk restock sebelum kehabisan.
        </Text>
      </View>
    ) : null;

  if (isTabletLandscape) {
    return (
      <SafeAreaView style={[styles.container, styles.containerTablet]} edges={['top', 'left', 'right']}>
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
              style={{ backgroundColor: tabletColors.blue600 }}
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
              leftElement={<SearchIcon size={16} color={tabletColors.gray400} />}
              style={styles.tabletSearchInput}
            />
          </View>

          {categories.length > 0 ? (
            <ScrollView
              horizontal
              style={{ height: 70 }}
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={[styles.categoryRow]}
            >
              <CategoryChip
                label="Semua"
                active={selectedCategoryId === null}
                tablet={isTabletLandscape}
                onPress={() => setSelectedCategoryId(null)}
              />
              {categories.map((cat) => (
                <CategoryChip
                  key={cat.id}
                  label={cat.categoryName}
                  active={selectedCategoryId === cat.id}
                  tablet={isTabletLandscape}
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
              <ProductGridCard
                item={item}
                tablet
                variant="catalog"
                onPress={() => navigation.navigate('ProductForm', { product: item })}
              />
            )}
            ListEmptyComponent={
              status === 'loading' ? (
                <Text color="muted" align="center" style={styles.empty}>
                  Memuat produk...
                </Text>
              ) : status === 'failed' ? (
                <EmptyState
                  icon={AlertTriangleIcon}
                  title="Produk gagal dimuat"
                  description={error ?? 'Terjadi kesalahan saat mengambil data produk. Coba lagi.'}
                  actionLabel="Coba Lagi"
                  onAction={() => dispatch(fetchProducts({ search }))}
                />
              ) : search || selectedCategoryId ? (
                <EmptyState icon={SearchIcon} title="Produk tidak ditemukan" description="Coba kata kunci atau kategori lain." />
              ) : (
                <EmptyState
                  icon={BoxIcon}
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
          leftElement={<SearchIcon size={16} color={colors.text.muted} />}
          rightElement={
            <Pressable onPress={onScanSearch} hitSlop={8} accessibilityLabel="Cari lewat scan barcode">
              <BarcodeIcon size={18} color={colors.text.secondary} />
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
          <ProductListItem item={item} onPress={() => navigation.navigate('ProductForm', { product: item })} />
        )}
        ListEmptyComponent={
          status === 'loading' ? (
            <Text color="muted" align="center" style={styles.empty}>
              Memuat produk...
            </Text>
          ) : status === 'failed' ? (
            <EmptyState
              icon={AlertTriangleIcon}
              title="Produk gagal dimuat"
              description={error ?? 'Terjadi kesalahan saat mengambil data produk. Coba lagi.'}
              actionLabel="Coba Lagi"
              onAction={() => dispatch(fetchProducts({ search }))}
            />
          ) : search ? (
            <EmptyState
              icon={SearchIcon}
              title="Produk tidak ditemukan"
              description={`Tidak ada produk yang cocok dengan "${search}". Coba kata kunci lain, atau scan barcode-nya langsung.`}
            />
          ) : (
            <EmptyState
              icon={BoxIcon}
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
