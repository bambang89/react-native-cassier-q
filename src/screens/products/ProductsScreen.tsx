import { useEffect, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import * as productsApi from '../../api/productsApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProducts, setSearch } from '../../store/slices/productsSlice';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import type { Product } from '../../types/models';
import { colors, spacing } from '../../theme';
import { Button, FormControl, Input, Link } from '../../components/ui/forms';
import { Badge } from '../../components/ui/dataDisplay';
import { AlertDialog, Modal } from '../../components/ui/overlay';
import { Card, Header, SwipeList } from '../../components/ui/recipes';
import { Text } from '../../components/ui/typography';

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

  const onLoadMore = () => {
    if (status === 'loading' || page + 1 >= totalPages) return;
    dispatch(fetchProducts({ search, page: page + 1 }));
  };

  const onDelete = async (product: Product) => {
    try {
      await productsApi.deleteProduct(product.id);
      setDeleteTarget(null);
      dispatch(fetchProducts({ search }));
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
          <Text color="muted" align="center" style={styles.empty}>
            {status === 'loading' ? 'Memuat produk...' : 'Belum ada produk'}
          </Text>
        }
      />

      <Modal isOpen={!!restockTarget} onClose={() => setRestockTarget(null)}>
        {restockTarget ? (
          <RestockForm
            product={restockTarget}
            onDone={() => {
              setRestockTarget(null);
              dispatch(fetchProducts({ search }));
            }}
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
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const parsed = Number(quantity);
    if (!parsed || parsed <= 0) return;
    setSubmitting(true);
    try {
      await productsApi.restockProduct(product.id, {
        unitId: product.baseUnitId,
        quantity: parsed,
        notes: notes || undefined,
      });
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
      <FormControl label={`Jumlah (${product.baseUnitName})`}>
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
  info: { flex: 1, marginRight: spacing.sm },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  empty: { marginTop: spacing['3xl'] },
  modalTitle: { marginBottom: spacing.base },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { minWidth: 90 },
});
