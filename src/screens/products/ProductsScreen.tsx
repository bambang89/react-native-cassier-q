import { useEffect, useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { deleteProduct, fetchProducts, restockProduct, setSearch } from '@/store/slices/productsSlice';
import { fetchProductUnits } from '@/store/slices/productUnitsSlice';
import { resolvePurchaseUnitChoices } from '@/utils/productUnits';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import type { Product } from '@/types/models';
import { colors, spacing } from '@/theme';
import { Button, FormControl, Input, Link, Pressable, Select } from '@/components/ui/forms';
import { Badge } from '@/components/ui/dataDisplay';
import { AlertDialog, Modal } from '@/components/ui/overlay';
import { Card, EmptyState, Header, SwipeList } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Products'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function ProductsScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { items, search, page, totalPages, status } = useAppSelector((state) => state.products);
  const [searchDraft, setSearchDraft] = useState(search);
  const [restockTarget, setRestockTarget] = useState<Product | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);

  useEffect(() => {
    dispatch(fetchProducts({ search }));
  }, [dispatch, search]);

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

  return (
    <View style={styles.container}>
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
                <Text weight="bold" color="success">
                  Rp {item.sellingPrice.toLocaleString('id-ID')}
                </Text>
                <Badge variant={item.stockQuantity > 0 ? 'neutral' : 'error'}>
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
    </View>
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
});
