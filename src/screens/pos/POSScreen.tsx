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
import { Card, EmptyState, Header } from '@/components/ui/recipes';
import { Heading, Text } from '@/components/ui/typography';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'POS'>,
  NativeStackScreenProps<RootStackParamList>
>;

// Di bawah angka ini, stok ditandai kuning (mau habis) — di 0, merah (habis).
// Bikin kasir langsung ngeh tanpa harus buka layar Produk terpisah.
const LOW_STOCK_THRESHOLD = 5;

function greetingForNow(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat pagi';
  if (hour < 15) return 'Selamat siang';
  if (hour < 19) return 'Selamat sore';
  return 'Selamat malam';
}

function todayLabel(): string {
  return new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function POSScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
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

  const renderProduct = ({ item }: { item: Product }) => {
    const outOfStock = item.stockQuantity <= 0;
    const lowStock = !outOfStock && item.stockQuantity <= LOW_STOCK_THRESHOLD;
    const stockColor = outOfStock ? 'error' : lowStock ? 'warning' : 'muted';

    return (
      <Card onPress={() => onAddToCart(item)} style={styles.card}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Text size="2xl">🛍️</Text>
          </View>
        )}
        <Text weight="semibold" numberOfLines={2} style={styles.cardName}>
          {item.productName}
        </Text>
        <View style={styles.cardFooter}>
          <Text color="success" weight="bold">
            Rp {item.sellingPrice.toLocaleString('id-ID')}
          </Text>
          <Text size="xs" weight="semibold" color={stockColor}>
            {outOfStock ? 'Stok habis' : `Stok ${item.stockQuantity} ${item.baseUnitName}`}
          </Text>
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.container}>
      <Header
        title={`${greetingForNow()}, ${user?.name?.split(' ')[0] ?? 'Kasir'}! 👋`}
        subtitle={todayLabel()}
        rightElement={
          <Button
            size="sm"
            onPress={() =>
              navigation.navigate('Scanner', {
                onFound: (product) => onAddToCart(product),
              })
            }
          >
            📷 Scan
          </Button>
        }
      />

      {sessionStatus !== 'loading' && !session ? (
        <View style={styles.sessionBanner}>
          <Text size="xl">🔓</Text>
          <View style={styles.sessionBannerInfo}>
            <Text weight="bold" style={styles.sessionBannerTitle}>
              Sesi kasir belum dibuka
            </Text>
            <Text size="sm" style={styles.sessionBannerText}>
              Buka sesi dulu dengan mengisi modal awal kas, baru bisa mulai mencatat penjualan hari ini.
            </Text>
            <Button size="sm" onPress={() => setOpenSessionModalVisible(true)} style={styles.sessionBannerButton}>
              Buka Sesi Sekarang
            </Button>
          </View>
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
          status === 'loading' ? (
            <Text color="muted" align="center" style={styles.empty}>
              Memuat produk...
            </Text>
          ) : (
            <EmptyState
              icon="🛍️"
              title="Belum Ada Produk"
              description="Tambahkan produk dulu di menu Produk supaya bisa langsung dijual di sini."
              actionLabel="Buka Menu Produk"
              onAction={() => navigation.navigate('Products')}
            />
          )
        }
      />

      {cartCount > 0 ? (
        <View style={styles.cartBar}>
          <View>
            <Text size="xs" style={styles.cartLabel}>
              🛒 {cartCount} item di keranjang
            </Text>
            <Text weight="bold" size="lg" style={styles.cartText}>
              Rp {cartTotal.toLocaleString('id-ID')}
            </Text>
          </View>
          <Button
            onPress={() => (session ? setCheckoutModalVisible(true) : setOpenSessionModalVisible(true))}
          >
            Checkout →
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
            <Text weight="bold" size="lg" style={styles.modalTitle}>
              Jual "{unitPicker.product.productName}" per apa?
            </Text>
            <Text color="secondary" size="sm" style={styles.unitPickerHint}>
              Produk ini bisa dijual dalam beberapa satuan. Pilih salah satu di bawah.
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
      <Text weight="bold" size="lg" style={styles.modalTitle}>
        🔓 Buka Sesi Kasir
      </Text>
      <Text color="secondary" size="sm" style={styles.openSessionHint}>
        Hitung dulu uang tunai yang ada di laci, lalu masukkan jumlahnya di bawah. Ini jadi patokan buat menghitung
        selisih kas saat sesi ditutup nanti.
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
      <Text weight="bold" size="lg" style={styles.modalTitle}>
        💳 Selesaikan Pembayaran
      </Text>
      <View style={styles.checkoutTotalBox}>
        <Text size="sm" color="secondary">
          Total belanja
        </Text>
        <Heading level="h3" style={styles.checkoutTotalValue}>
          Rp {total.toLocaleString('id-ID')}
        </Heading>
      </View>

      <FormControl label="Metode pembayaran" isRequired>
        <Select value={paymentMethod} onChange={setPaymentMethod} options={PAYMENT_METHODS} />
      </FormControl>
      <FormControl label="Jumlah dibayar" isRequired helperText="Isi jumlah uang yang diterima dari pembeli">
        <Input keyboardType="numeric" value={paymentAmount} onChangeText={setPaymentAmount} />
      </FormControl>
      <View style={styles.changeBox}>
        <Text weight="semibold">Kembalian</Text>
        <Text weight="bold" size="lg" color={change > 0 ? 'success' : 'secondary'}>
          Rp {change.toLocaleString('id-ID')}
        </Text>
      </View>

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
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    padding: spacing.base,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.warning[200],
    backgroundColor: colors.warning[50],
  },
  sessionBannerInfo: { flex: 1 },
  sessionBannerTitle: { color: colors.warning[700], marginBottom: 2 },
  sessionBannerText: { color: colors.warning[700] },
  sessionBannerButton: { alignSelf: 'flex-start', marginTop: spacing.sm },
  grid: { paddingHorizontal: spacing.md, paddingBottom: 96 },
  gridRow: { gap: spacing.md },
  card: { flex: 1, minHeight: 120, justifyContent: 'space-between', marginBottom: spacing.md },
  cardImage: { width: '100%', height: 72, borderRadius: 8, marginBottom: spacing.sm, backgroundColor: colors.gray[100] },
  cardImagePlaceholder: {
    width: '100%',
    height: 72,
    borderRadius: 8,
    marginBottom: spacing.sm,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardName: { minHeight: 40 },
  cardFooter: { marginTop: spacing.sm, gap: 2 },
  empty: { marginTop: spacing['3xl'] },
  cartBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.gray[900],
    padding: spacing.base,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cartLabel: { color: colors.gray[300], marginBottom: 2 },
  cartText: { color: colors.white },
  modalTitle: { marginBottom: spacing.base },
  unitPickerHint: { marginBottom: spacing.base },
  openSessionHint: { marginBottom: spacing.base },
  unitChoice: { marginBottom: spacing.sm },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { minWidth: 90 },
  checkoutTotalBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.base,
    marginBottom: spacing.base,
  },
  checkoutTotalValue: { marginTop: 2 },
  changeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
});
