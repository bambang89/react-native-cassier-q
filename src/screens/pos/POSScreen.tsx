import { useEffect, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { createOrder } from '../../api/ordersApi';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchProducts } from '../../store/slices/productsSlice';
import { addItem, clearCart, selectCartCount, selectCartTotal } from '../../store/slices/cartSlice';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import type { Product } from '../../types/models';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'POS'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function POSScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { items, status } = useAppSelector((state) => state.products);
  const cartItems = useAppSelector((state) => state.cart.items);
  const cartCount = useAppSelector(selectCartCount);
  const cartTotal = useAppSelector(selectCartTotal);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchProducts());
  }, [status, dispatch]);

  const onCheckout = async () => {
    setCheckingOut(true);
    try {
      await createOrder(cartItems);
      dispatch(clearCart());
      Alert.alert('Berhasil', 'Transaksi selesai.');
    } catch {
      Alert.alert('Gagal', 'Transaksi gagal, coba lagi.');
    } finally {
      setCheckingOut(false);
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <Pressable style={styles.card} onPress={() => dispatch(addItem(item))}>
      <Text style={styles.cardName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.cardPrice}>Rp {item.price.toLocaleString('id-ID')}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kasir</Text>
        <Pressable style={styles.scanButton} onPress={() => navigation.navigate('Scanner')}>
          <Text style={styles.scanButtonText}>Scan Barcode</Text>
        </Pressable>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        onRefresh={() => dispatch(fetchProducts())}
        refreshing={status === 'loading'}
        ListEmptyComponent={
          <Text style={styles.empty}>
            {status === 'loading' ? 'Memuat produk...' : 'Belum ada produk'}
          </Text>
        }
      />

      {cartCount > 0 ? (
        <View style={styles.cartBar}>
          <Text style={styles.cartText}>
            {cartCount} item · Rp {cartTotal.toLocaleString('id-ID')}
          </Text>
          <Pressable onPress={onCheckout} disabled={checkingOut}>
            <Text style={styles.cartAction}>{checkingOut ? 'Memproses...' : 'Checkout'}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  title: { fontSize: 22, fontWeight: '700' },
  scanButton: { backgroundColor: '#16a34a', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 12 },
  scanButtonText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  grid: { paddingHorizontal: 12, paddingBottom: 80 },
  gridRow: { gap: 12 },
  card: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    minHeight: 90,
    justifyContent: 'space-between',
  },
  cardName: { fontWeight: '600' },
  cardPrice: { color: '#16a34a', fontWeight: '700', marginTop: 8 },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#111',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartText: { color: '#fff', fontWeight: '600' },
  cartAction: { color: '#4ade80', fontWeight: '700' },
});
