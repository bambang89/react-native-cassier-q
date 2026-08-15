import { useEffect, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, View } from 'react-native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProducts } from '@/store/slices/productsSlice';
import { fetchProductUnits } from '@/store/slices/productUnitsSlice';
import { openSession, fetchCurrentSession } from '@/store/slices/cashierSessionSlice';
import { createOrder } from '@/store/slices/ordersSlice';
import { addItem, clearCart, selectCartCount, selectCartTotal } from '@/store/slices/cartSlice';
import type { AddItemPayload } from '@/store/slices/cartSlice';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import type { CartItem, Order, Product, ProductUnit } from '@/types/models';
import { PAYMENT_METHODS, type PaymentMethod } from '@/types/models';
import { resolveSaleUnitChoices } from '@/utils/productUnits';
import { colors, spacing } from '@/theme';
import { Button, FormControl, Input, Select } from '@/components/ui/forms';
import { Modal } from '@/components/ui/overlay';
import { Card, Header } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';

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
  const session = useAppSelector((state) => state.cashierSession.current);
  const sessionStatus = useAppSelector((state) => state.cashierSession.status);
  const productUnitsById = useAppSelector((state) => state.productUnits.byProductId);
  const [openSessionModalVisible, setOpenSessionModalVisible] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [unitPicker, setUnitPicker] = useState<{ product: Product; choices: ProductUnit[] } | null>(null);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchProducts({}));
    dispatch(fetchCurrentSession());
  }, [status, dispatch]);

  const addToCartWithUnit = (product: Product, unit: ProductUnit) => {
    const payload: AddItemPayload = {
      product,
      unit: { unitId: unit.unitId, unitName: unit.unitName, conversionToBase: unit.conversionToBase },
    };
    dispatch(addItem(payload));
  };

  const onAddToCart = async (product: Product) => {
    if (!session) {
      Alert.alert('Sesi kasir belum dibuka', 'Buka sesi kasir dulu sebelum mencatat penjualan.');
      return;
    }
    let units = productUnitsById[product.id];
    if (!units) {
      try {
        units = await dispatch(fetchProductUnits(product.id)).unwrap().then((r) => r.items);
      } catch {
        units = [];
      }
    }
    const choices = resolveSaleUnitChoices(units, product);
    if (choices.length === 1) {
      addToCartWithUnit(product, choices[0]);
    } else {
      setUnitPicker({ product, choices });
    }
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <Card onPress={() => onAddToCart(item)} style={styles.card}>
      {item.imageUrl ? <Image source={{ uri: item.imageUrl }} style={styles.cardImage} /> : null}
      <Text weight="semibold" numberOfLines={2}>
        {item.productName}
      </Text>
      <Text color="success" weight="bold" style={styles.cardPrice}>
        Rp {item.sellingPrice.toLocaleString('id-ID')}
      </Text>
      <Text size="xs" color="muted">
        Stok: {item.stockQuantity} {item.baseUnitName}
      </Text>
    </Card>
  );

  return (
    <View style={styles.container}>
      <Header
        title="Kasir"
        rightElement={
          <Button
            size="sm"
            onPress={() =>
              navigation.navigate('Scanner', {
                onFound: (product) => onAddToCart(product),
              })
            }
          >
            Scan Barcode
          </Button>
        }
      />

      {sessionStatus !== 'loading' && !session ? (
        <View style={styles.sessionBanner}>
          <Text size="sm" style={styles.sessionBannerText}>
            Sesi kasir belum dibuka. Buka sesi untuk mulai mencatat penjualan.
          </Text>
          <Button size="sm" variant="outline" onPress={() => setOpenSessionModalVisible(true)}>
            Buka Sesi
          </Button>
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        numColumns={2}
        contentContainerStyle={styles.grid}
        columnWrapperStyle={styles.gridRow}
        onRefresh={() => dispatch(fetchProducts({}))}
        refreshing={status === 'loading'}
        ListEmptyComponent={
          <Text color="muted" align="center" style={styles.empty}>
            {status === 'loading' ? 'Memuat produk...' : 'Belum ada produk'}
          </Text>
        }
      />

      {cartCount > 0 ? (
        <View style={styles.cartBar}>
          <Text weight="semibold" style={styles.cartText}>
            {cartCount} item · Rp {cartTotal.toLocaleString('id-ID')}
          </Text>
          <Button
            size="sm"
            onPress={() => (session ? setCheckoutModalVisible(true) : setOpenSessionModalVisible(true))}
          >
            Checkout
          </Button>
        </View>
      ) : null}

      <Modal isOpen={openSessionModalVisible} onClose={() => setOpenSessionModalVisible(false)}>
        <OpenSessionForm
          onDone={() => setOpenSessionModalVisible(false)}
          onCancel={() => setOpenSessionModalVisible(false)}
        />
      </Modal>

      <Modal isOpen={checkoutModalVisible} onClose={() => setCheckoutModalVisible(false)}>
        <CheckoutForm
          total={cartTotal}
          cartItems={cartItems}
          onDone={(order) => {
            setCheckoutModalVisible(false);
            dispatch(clearCart());
            navigation.navigate('Receipt', { orderId: order.id });
          }}
          onCancel={() => setCheckoutModalVisible(false)}
        />
      </Modal>

      <Modal isOpen={!!unitPicker} onClose={() => setUnitPicker(null)}>
        {unitPicker ? (
          <View>
            <Text weight="semibold" size="lg" style={styles.modalTitle}>
              Pilih satuan — {unitPicker.product.productName}
            </Text>
            {unitPicker.choices.map((unit) => (
              <Button
                key={unit.unitId}
                variant="outline"
                style={styles.unitChoice}
                onPress={() => {
                  addToCartWithUnit(unitPicker.product, unit);
                  setUnitPicker(null);
                }}
              >
                {`${unit.unitName} — Rp ${(unitPicker.product.sellingPrice * unit.conversionToBase).toLocaleString('id-ID')}`}
              </Button>
            ))}
          </View>
        ) : null}
      </Modal>
    </View>
  );
}

function OpenSessionForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const dispatch = useAppDispatch();
  const [openingCash, setOpeningCash] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const parsed = Number(openingCash);
    if (Number.isNaN(parsed) || parsed < 0) return;
    setSubmitting(true);
    try {
      await dispatch(openSession(parsed)).unwrap();
      onDone();
    } catch {
      Alert.alert('Gagal', 'Sesi kasir tidak bisa dibuka.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text weight="semibold" size="lg" style={styles.modalTitle}>
        Buka Sesi Kasir
      </Text>
      <FormControl label="Modal awal (kas di laci)" isRequired>
        <Input keyboardType="numeric" value={openingCash} onChangeText={setOpeningCash} placeholder="0" />
      </FormControl>
      <View style={styles.modalActions}>
        <Button variant="ghost" onPress={onCancel} style={styles.modalAction}>
          Batal
        </Button>
        <Button onPress={onSubmit} loading={submitting} disabled={!openingCash} style={styles.modalAction}>
          Buka
        </Button>
      </View>
    </View>
  );
}

function CheckoutForm({
  total,
  cartItems,
  onDone,
  onCancel,
}: {
  total: number;
  cartItems: CartItem[];
  onDone: (order: Order) => void;
  onCancel: () => void;
}) {
  const dispatch = useAppDispatch();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>('CASH');
  const [paymentAmount, setPaymentAmount] = useState(String(total));
  const [submitting, setSubmitting] = useState(false);

  const change = Math.max(0, Number(paymentAmount || 0) - total);

  const onSubmit = async () => {
    if (!paymentMethod) return;
    const amount = Number(paymentAmount);
    if (Number.isNaN(amount) || amount < total) {
      Alert.alert('Jumlah bayar kurang', 'Jumlah pembayaran tidak boleh kurang dari total belanja.');
      return;
    }
    setSubmitting(true);
    try {
      const order = await dispatch(
        createOrder({ items: cartItems, payload: { paymentMethod, paymentAmount: amount } }),
      ).unwrap();
      onDone(order);
    } catch {
      Alert.alert('Gagal', 'Transaksi gagal, coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text weight="semibold" size="lg" style={styles.modalTitle}>
        Checkout
      </Text>
      <Text color="secondary" style={styles.checkoutTotal}>
        Total: Rp {total.toLocaleString('id-ID')}
      </Text>

      <FormControl label="Metode pembayaran" isRequired>
        <Select value={paymentMethod} onChange={setPaymentMethod} options={PAYMENT_METHODS} />
      </FormControl>
      <FormControl label="Jumlah dibayar" isRequired>
        <Input keyboardType="numeric" value={paymentAmount} onChangeText={setPaymentAmount} />
      </FormControl>
      <Text size="sm" color="secondary" style={styles.change}>
        Kembalian: Rp {change.toLocaleString('id-ID')}
      </Text>

      <View style={styles.modalActions}>
        <Button variant="ghost" onPress={onCancel} style={styles.modalAction}>
          Batal
        </Button>
        <Button onPress={onSubmit} loading={submitting} style={styles.modalAction}>
          Bayar
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  sessionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    padding: spacing.sm,
    borderRadius: 10,
    backgroundColor: colors.warning[50],
  },
  sessionBannerText: { flex: 1, marginRight: spacing.sm, color: colors.warning[700] },
  grid: { paddingHorizontal: spacing.md, paddingBottom: 80 },
  gridRow: { gap: spacing.md },
  card: { flex: 1, minHeight: 90, justifyContent: 'space-between', marginBottom: spacing.md },
  cardImage: { width: '100%', height: 64, borderRadius: 8, marginBottom: spacing.sm, backgroundColor: colors.gray[100] },
  cardPrice: { marginTop: spacing.sm },
  empty: { marginTop: spacing['3xl'] },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.gray[900],
    padding: spacing.base,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartText: { color: colors.white },
  modalTitle: { marginBottom: spacing.base },
  unitChoice: { marginBottom: spacing.sm },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { minWidth: 90 },
  checkoutTotal: { marginBottom: spacing.base },
  change: { marginBottom: spacing.sm },
});
