import { useEffect } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProducts } from '../../store/slices/productsSlice';

export default function ProductsScreen() {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((state) => state.products);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchProducts());
  }, [status, dispatch]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Produk</Text>
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={() => dispatch(fetchProducts())}
        refreshing={status === 'loading'}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.sku}>{item.sku}</Text>
            </View>
            <View style={styles.right}>
              <Text style={styles.price}>Rp {item.price.toLocaleString('id-ID')}</Text>
              <Text style={styles.stock}>Stok: {item.stock}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada produk</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  name: { fontWeight: '600' },
  sku: { color: '#999', fontSize: 12 },
  right: { alignItems: 'flex-end' },
  price: { fontWeight: '700', color: '#16a34a' },
  stock: { color: '#999', fontSize: 12 },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
});
