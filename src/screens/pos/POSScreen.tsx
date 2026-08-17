import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Image, Platform, ScrollView, StyleSheet, View } from 'react-native';
import type { TextInput as RNTextInputRef } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProducts } from '@/store/slices/productsSlice';
import { fetchProductUnits } from '@/store/slices/productUnitsSlice';
import { fetchCategories } from '@/store/slices/categoriesSlice';
import { fetchCustomers } from '@/store/slices/customersSlice';
import { openSession, fetchCurrentSession } from '@/store/slices/cashierSessionSlice';
import { fetchStoreProfile } from '@/store/slices/storeProfileSlice';
import { createOrder } from '@/store/slices/ordersSlice';
import {
  addItem,
  clearCart,
  decrementItem,
  incrementItem,
  removeItem,
  selectCartCount,
  selectCartTotal,
} from '@/store/slices/cartSlice';
import type { AddItemPayload } from '@/store/slices/cartSlice';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import type { CartItem, Order, Product, ProductUnit } from '@/types/models';
import { PAYMENT_METHODS, type PaymentMethod } from '@/types/models';
import { resolveSaleUnitChoices } from '@/utils/productUnits';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, radii, spacing } from '@/theme';
import { Button, FormControl, Input, Pressable, Select, Switch } from '@/components/ui/forms';
import { Modal } from '@/components/ui/overlay';
import { Badge } from '@/components/ui/dataDisplay';
import { Card, EmptyState, Header } from '@/components/ui/recipes';
import { Heading, Text } from '@/components/ui/typography';
import { HStack, VStack } from '@/components/ui/layout';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'POS'>,
  NativeStackScreenProps<RootStackParamList>
>;

// Di bawah angka ini, stok ditandai kuning (mau habis) — di 0, merah (habis).
// Bikin kasir langsung ngeh tanpa harus buka layar Produk terpisah.
const LOW_STOCK_THRESHOLD = 5;

// Preset nominal uang tunai yang paling sering dipakai buat belanja kelontong
// — biar kasir tidak perlu ngetik manual tiap transaksi.
const CASH_PRESETS = [50000, 100000, 150000, 200000];

const PPN_RATE = 0.11;

const SUMMARY_PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: string }[] = [
  { value: 'CASH', label: 'Tunai', icon: '💵' },
  { value: 'QRIS', label: 'QRIS', icon: '📱' },
  { value: 'DEBIT', label: 'Debit', icon: '💳' },
];

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

function clockLabel(date: Date): string {
  return `${date.toLocaleTimeString('id-ID', { hour12: false })} WIB`;
}

function formatRupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

export default function POSScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { isTabletLandscape } = useResponsive();
  const user = useAppSelector((state) => state.auth.user);
  const storeProfile = useAppSelector((state) => state.storeProfile.profile);
  const { items, status } = useAppSelector((state) => state.products);
  const categories = useAppSelector((state) => state.categories.items);
  const cartItems = useAppSelector((state) => state.cart.items);
  const cartCount = useAppSelector(selectCartCount);
  const cartTotal = useAppSelector(selectCartTotal);
  const session = useAppSelector((state) => state.cashierSession.current);
  const sessionStatus = useAppSelector((state) => state.cashierSession.status);
  const productUnitsById = useAppSelector((state) => state.productUnits.byProductId);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openSessionModalVisible, setOpenSessionModalVisible] = useState(false);
  const [checkoutModalVisible, setCheckoutModalVisible] = useState(false);
  const [unitPicker, setUnitPicker] = useState<{ product: Product; choices: ProductUnit[] } | null>(null);
  const [now, setNow] = useState(() => new Date());

  // Kontrol diskon/PPN/metode pembayaran hidup di sini supaya panel
  // "Ringkasan Pembayaran" (tablet) bisa menampilkannya sebelum kasir menekan Bayar.
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [ppnEnabled, setPpnEnabled] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');

  const searchInputRef = useRef<RNTextInputRef>(null);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchProducts({}));
    dispatch(fetchCurrentSession());
    dispatch(fetchCategories());
    dispatch(fetchCustomers());
    dispatch(fetchStoreProfile());
  }, [status, dispatch]);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const canOpenCheckout = cartCount > 0;

  const openCheckout = () => {
    if (!canOpenCheckout) return;
    if (session) setCheckoutModalVisible(true);
    else setOpenSessionModalVisible(true);
  };

  // Shortcut keyboard cuma masuk akal di web (tablet kasir yang dipasangi keyboard fisik).
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F2') {
        event.preventDefault();
        searchInputRef.current?.focus();
      } else if (event.key === 'F9') {
        event.preventDefault();
        openCheckout();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canOpenCheckout, session]);

  const filteredProducts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return items.filter((p) => {
      const matchesCategory = selectedCategoryId ? p.categoryId === selectedCategoryId : true;
      const matchesQuery = query
        ? p.productName.toLowerCase().includes(query) || p.sku.toLowerCase().includes(query)
        : true;
      return matchesCategory && matchesQuery;
    });
  }, [items, selectedCategoryId, searchQuery]);

  const subtotal = cartTotal;
  const discountAmount =
    discountType === 'percent'
      ? Math.round((subtotal * Math.min(100, Math.max(0, Number(discountValue) || 0))) / 100)
      : Math.min(subtotal, Math.max(0, Number(discountValue) || 0));
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = ppnEnabled ? Math.round(afterDiscount * PPN_RATE) : 0;
  const grandTotal = afterDiscount + taxAmount;

  const primaryRole = user?.roles?.[0] ?? null;
  const storeName = storeProfile?.storeName ?? primaryRole?.storeName ?? '-';
  const roleName = primaryRole?.roleName ?? 'Kasir';

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

  const onCheckoutDone = (order: Order, withReceipt: boolean) => {
    setCheckoutModalVisible(false);
    dispatch(clearCart());
    setDiscountValue('');
    setPaymentMethod('CASH');
    if (withReceipt) {
      navigation.navigate('Receipt', { orderId: order.id });
    }
  };

  const onClearCart = () => {
    if (cartCount === 0) return;
    Alert.alert('Hapus keranjang?', 'Semua item yang dipilih akan dihapus.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => dispatch(clearCart()) },
    ]);
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard item={item} onPress={() => onAddToCart(item)} />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {isTabletLandscape ? (
        <DesktopHeader
          storeName={storeName}
          userName={user?.name ?? 'Kasir'}
          roleName={roleName}
          now={now}
        />
      ) : (
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
      )}

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

      <View style={styles.searchWrap}>
        <View style={styles.searchInput}>
          <Input
            ref={searchInputRef}
            placeholder="Cari produk (F2)"
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftElement={<Text style={styles.searchIcon}>🔍</Text>}
          />
        </View>
        {isTabletLandscape ? (
          <Button
            size="md"
            style={styles.scanButtonTablet}
            onPress={() =>
              navigation.navigate('Scanner', {
                onFound: (product) => onAddToCart(product),
              })
            }
          >
            📷 Scan
          </Button>
        ) : null}
      </View>

      {categories.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryRow}
        >
          <CategoryChip
            label="Semua produk"
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

      <View style={styles.body}>
        <FlatList
          key={isTabletLandscape ? 'grid-4' : 'grid-2'}
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={isTabletLandscape ? 4 : 2}
          contentContainerStyle={[styles.grid, isTabletLandscape && styles.gridTabletPadding]}
          columnWrapperStyle={styles.gridRow}
          style={styles.gridList}
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
                title={selectedCategoryId || searchQuery ? 'Tidak Ada Produk Cocok' : 'Belum Ada Produk'}
                description="Tambahkan produk dulu di menu Produk supaya bisa langsung dijual di sini."
                actionLabel="Buka Menu Produk"
                onAction={() => navigation.navigate('Products')}
              />
            )
          }
        />

        {isTabletLandscape ? (
          <View style={styles.sidePanel}>
            <PaymentSummaryPanel
              cartItems={cartItems}
              cartCount={cartCount}
              subtotal={subtotal}
              discountType={discountType}
              onChangeDiscountType={() =>
                setDiscountType((prev) => (prev === 'percent' ? 'amount' : 'percent'))
              }
              discountValue={discountValue}
              onChangeDiscountValue={setDiscountValue}
              discountAmount={discountAmount}
              ppnEnabled={ppnEnabled}
              onChangePpnEnabled={setPpnEnabled}
              taxAmount={taxAmount}
              grandTotal={grandTotal}
              paymentMethod={paymentMethod}
              onChangePaymentMethod={setPaymentMethod}
              canCheckout={canOpenCheckout}
              onCheckout={openCheckout}
              onClearCart={onClearCart}
            />
          </View>
        ) : null}
      </View>

      {!isTabletLandscape && cartCount > 0 ? (
        <View style={styles.cartBar}>
          <View>
            <Text size="xs" style={styles.cartLabel}>
              🛒 {cartCount} item di keranjang
            </Text>
            <Text weight="bold" size="lg" style={styles.cartText}>
              {formatRupiah(cartTotal)}
            </Text>
          </View>
          <Button onPress={openCheckout}>Checkout →</Button>
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
          showItemsList={!isTabletLandscape}
          onDone={onCheckoutDone}
          onCancel={() => setCheckoutModalVisible(false)}
          externalDiscountAmount={isTabletLandscape ? discountAmount : undefined}
          externalTaxAmount={isTabletLandscape ? taxAmount : undefined}
          externalPaymentMethod={isTabletLandscape ? paymentMethod : undefined}
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
                {`${unit.unitName} — ${formatRupiah(unitPicker.product.sellingPrice * unit.conversionToBase)}`}
              </Button>
            ))}
          </View>
        ) : null}
      </Modal>
    </SafeAreaView>
  );
}

function DesktopHeader({
  storeName,
  userName,
  roleName,
  now,
}: {
  storeName: string;
  userName: string;
  roleName: string;
  now: Date;
}) {
  return (
    <View style={styles.topBar}>
      <View>
        <Heading level="h3">Kasir</Heading>
        <Text color="secondary" size="sm" style={styles.topBarSubtitle}>
          {storeName}
        </Text>
      </View>
      <View style={styles.topBarRight}>
        <Pressable
          style={styles.iconButton}
          accessibilityLabel="Notifikasi"
          onPress={() => Alert.alert('Notifikasi', 'Belum ada notifikasi baru.')}
        >
          <Text size="lg">🔔</Text>
        </Pressable>
        <View style={styles.clockBox}>
          <Text size="xs" color="muted">
            Waktu
          </Text>
          <Text weight="semibold" size="sm">
            {clockLabel(now)}
          </Text>
        </View>
        <View style={styles.userBox}>
          <View style={styles.avatarCircle}>
            <Text weight="bold" color="inverse" size="sm">
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text weight="semibold" size="sm" numberOfLines={1} style={styles.userName}>
              {userName}
            </Text>
            <Text size="xs" color="muted">
              {roleName}
            </Text>
          </View>
        </View>
      </View>
    </View>
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

function ProductCard({ item, onPress }: { item: Product; onPress: () => void }) {
  const outOfStock = item.stockQuantity <= 0;
  const lowStock = !outOfStock && item.stockQuantity <= LOW_STOCK_THRESHOLD;
  const stockColor = outOfStock ? 'error' : lowStock ? 'warning' : 'muted';

  return (
    <Card padding="none" style={styles.card}>
      <View style={styles.cardImageWrap}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Text size="2xl">🛍️</Text>
          </View>
        )}
        {item.categoryName ? (
          <View style={styles.categoryBadge}>
            <Text size="xs" weight="semibold" color="inverse" numberOfLines={1}>
              {item.categoryName}
            </Text>
          </View>
        ) : null}
      </View>
      <View style={styles.cardBody}>
        <View>
          <Text weight="semibold" numberOfLines={2} style={styles.cardName}>
            {item.productName}
          </Text>
          <Text size="xs" color="muted">
            {item.sku}
          </Text>
        </View>
        <View style={styles.cardFooter}>
          <View>
            <Text color="link" weight="bold">
              {formatRupiah(item.sellingPrice)}
            </Text>
            <Text size="xs" weight="semibold" color={stockColor}>
              {outOfStock ? 'Stok habis' : `Stok: ${item.stockQuantity}`}
            </Text>
          </View>
          <Pressable
            style={[styles.addButton, outOfStock && styles.addButtonDisabled]}
            onPress={onPress}
            disabled={outOfStock}
            accessibilityLabel={`Tambah ${item.productName} ke keranjang`}
          >
            <Text weight="bold" color="inverse" size="lg">
              +
            </Text>
          </Pressable>
        </View>
      </View>
    </Card>
  );
}

function QtyStepper({ item }: { item: CartItem }) {
  const dispatch = useAppDispatch();
  return (
    <HStack space="sm" align="center">
      <Pressable
        style={styles.stepperButton}
        onPress={() => dispatch(decrementItem(item.product.id))}
        accessibilityLabel="Kurangi jumlah"
      >
        <Text weight="bold">−</Text>
      </Pressable>
      <Text weight="bold" style={styles.stepperQty}>
        {item.quantity}
      </Text>
      <Pressable
        style={styles.stepperButton}
        onPress={() => dispatch(incrementItem(item.product.id))}
        accessibilityLabel="Tambah jumlah"
      >
        <Text weight="bold">+</Text>
      </Pressable>
    </HStack>
  );
}

function CartItemRow({ item }: { item: CartItem }) {
  const dispatch = useAppDispatch();
  const unitPrice = item.product.sellingPrice * item.unitConversionToBase;
  const lineTotal = unitPrice * item.quantity;
  return (
    <View style={styles.cartRow}>
      <View style={styles.cartRowTop}>
        <Text weight="semibold" numberOfLines={2} style={styles.cartRowName}>
          {item.product.productName}
        </Text>
        <QtyStepper item={item} />
      </View>
      <View style={styles.cartRowBottom}>
        <View>
          <Text size="xs" color="muted">
            {item.unitName} · {formatRupiah(unitPrice)} X {item.quantity}
          </Text>
          <Text weight="bold" color="link" size="sm">
            {formatRupiah(lineTotal)}
          </Text>
        </View>
        <Pressable
          style={styles.trashButton}
          onPress={() => dispatch(removeItem(item.product.id))}
          accessibilityLabel="Hapus dari keranjang"
        >
          <Text size="sm">🗑️</Text>
        </Pressable>
      </View>
    </View>
  );
}

function PaymentSummaryPanel({
  cartItems,
  cartCount,
  subtotal,
  discountType,
  onChangeDiscountType,
  discountValue,
  onChangeDiscountValue,
  discountAmount,
  ppnEnabled,
  onChangePpnEnabled,
  taxAmount,
  grandTotal,
  paymentMethod,
  onChangePaymentMethod,
  canCheckout,
  onCheckout,
  onClearCart,
}: {
  cartItems: CartItem[];
  cartCount: number;
  subtotal: number;
  discountType: 'percent' | 'amount';
  onChangeDiscountType: () => void;
  discountValue: string;
  onChangeDiscountValue: (value: string) => void;
  discountAmount: number;
  ppnEnabled: boolean;
  onChangePpnEnabled: (value: boolean) => void;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod;
  onChangePaymentMethod: (value: PaymentMethod) => void;
  canCheckout: boolean;
  onCheckout: () => void;
  onClearCart: () => void;
}) {
  return (
    <VStack style={styles.sidePanelInner}>
      <View style={styles.sidePanelHeader}>
        <Heading level="h4">Ringkasan Pembayaran</Heading>
        <Badge variant="primary">{`${cartCount} Item`}</Badge>
      </View>

      <Text weight="semibold" size="sm" color="secondary" style={styles.itemsSectionTitle}>
        Item Dipilih
      </Text>
      {cartItems.length > 0 ? (
        <ScrollView style={styles.sidePanelList} showsVerticalScrollIndicator={false}>
          {cartItems.map((item) => (
            <CartItemRow key={`${item.product.id}-${item.unitId}`} item={item} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.sidePanelEmpty}>
          <Text size="3xl">🧺</Text>
          <Text color="muted" size="sm" style={styles.sidePanelEmptyText}>
            Belum ada item, ketuk produk untuk menambahkan.
          </Text>
        </View>
      )}

      <View style={styles.summaryDivider} />

      <View style={styles.summaryRow}>
        <Text color="secondary">Sub total</Text>
        <Text weight="semibold">{formatRupiah(subtotal)}</Text>
      </View>

      <Text weight="semibold" size="sm" style={styles.discountLabel}>
        Diskon (F7)
      </Text>
      <View style={styles.discountRow}>
        <Pressable style={styles.discountTypeToggle} onPress={onChangeDiscountType}>
          <Text weight="semibold" size="sm">
            {discountType === 'percent' ? '%' : 'Rp'}
          </Text>
          <Text size="xs" color="muted">
            ⌄
          </Text>
        </Pressable>
        <Input
          keyboardType="numeric"
          value={discountValue}
          onChangeText={onChangeDiscountValue}
          placeholder="0"
          style={styles.discountInput}
        />
      </View>

      <View style={styles.ppnRow}>
        <Text weight="semibold" size="sm">
          PPN 11%
        </Text>
        <View style={styles.ppnRight}>
          {ppnEnabled ? (
            <Text size="sm" color="secondary">
              {formatRupiah(taxAmount)}
            </Text>
          ) : null}
          <Switch value={ppnEnabled} onValueChange={onChangePpnEnabled} />
        </View>
      </View>

      {discountAmount > 0 ? (
        <View style={styles.summaryRow}>
          <Text color="secondary" size="sm">
            Diskon
          </Text>
          <Text weight="semibold" size="sm" color="link">
            −{formatRupiah(discountAmount)}
          </Text>
        </View>
      ) : null}

      <View style={styles.totalRow}>
        <Text color="secondary">Total pembayaran</Text>
        <Heading level="h3">{formatRupiah(grandTotal)}</Heading>
      </View>

      <Text weight="semibold" size="sm" style={styles.paymentMethodLabel}>
        Metode pembayaran:
      </Text>
      <View style={styles.paymentMethodGrid}>
        {SUMMARY_PAYMENT_METHODS.map((method) => {
          const active = paymentMethod === method.value;
          return (
            <Pressable
              key={method.value}
              onPress={() => onChangePaymentMethod(method.value)}
              style={[styles.paymentMethodBox, active && styles.paymentMethodBoxActive]}
            >
              <Text size="lg">{method.icon}</Text>
              <Text size="xs" weight="semibold" color={active ? 'link' : 'secondary'}>
                {method.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Button fullWidth disabled={!canCheckout} onPress={onCheckout} style={styles.payButton}>
        Bayar (F9)
      </Button>
      <Button
        fullWidth
        variant="dangerOutline"
        disabled={cartCount === 0}
        onPress={onClearCart}
        style={styles.clearCartButton}
      >
        🗑️ Hapus keranjang
      </Button>
    </VStack>
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

const NO_CUSTOMER = '__none__';

function CheckoutForm({
  total,
  cartItems,
  showItemsList,
  onDone,
  onCancel,
  externalDiscountAmount,
  externalTaxAmount,
  externalPaymentMethod,
}: {
  total: number;
  cartItems: CartItem[];
  showItemsList: boolean;
  onDone: (order: Order, withReceipt: boolean) => void;
  onCancel: () => void;
  /** Kalau diisi, panel "Ringkasan Pembayaran" (tablet) sudah menentukan nilai ini —
   * modal ini cuma menampilkannya sebagai ringkasan, bukan input yang bisa diubah lagi. */
  externalDiscountAmount?: number;
  externalTaxAmount?: number;
  externalPaymentMethod?: PaymentMethod;
}) {
  const dispatch = useAppDispatch();
  const { height } = useResponsive();
  const customers = useAppSelector((state) => state.customers.items);
  const lockPaymentControls = externalDiscountAmount !== undefined;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(externalPaymentMethod ?? 'CASH');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [discount, setDiscount] = useState('');
  const taxAmount = externalTaxAmount ?? 0;
  const discountAmount = lockPaymentControls
    ? (externalDiscountAmount ?? 0)
    : Math.min(total, Math.max(0, Number(discount || 0)));
  const payableTotal = total - discountAmount + taxAmount;
  const [paymentAmount, setPaymentAmount] = useState(String(payableTotal));
  const [submitting, setSubmitting] = useState<'receipt' | 'plain' | null>(null);

  const selectedCustomer = customers.find((c) => c.id === customerId) ?? null;
  const amountNumber = Number(paymentAmount || 0);
  const change = Math.max(0, amountNumber - payableTotal);
  const remainingAsDebt = selectedCustomer ? Math.max(0, payableTotal - amountNumber) : 0;
  const submitting_ = submitting !== null;

  const onSubmit = async (withReceipt: boolean) => {
    const amount = Number(paymentAmount);
    if (Number.isNaN(amount) || amount < 0) {
      Alert.alert('Jumlah tidak valid', 'Isi jumlah pembayaran yang benar.');
      return;
    }
    // Bayar kurang dari total cuma boleh kalau ada pelanggan yang dipilih —
    // sisanya jadi catatan utang. Tanpa pelanggan, tetap wajib lunas di kasir.
    if (!selectedCustomer && amount < payableTotal) {
      Alert.alert('Jumlah bayar kurang', 'Jumlah pembayaran tidak boleh kurang dari total belanja.');
      return;
    }
    setSubmitting(withReceipt ? 'receipt' : 'plain');
    try {
      const order = await dispatch(
        createOrder({
          items: cartItems,
          payload: {
            paymentMethod,
            paymentAmount: amount,
            discountAmount: discountAmount > 0 ? discountAmount : undefined,
            taxAmount: taxAmount > 0 ? taxAmount : undefined,
            customerId: selectedCustomer?.id,
          },
        }),
      ).unwrap();
      if (selectedCustomer) dispatch(fetchCustomers());
      onDone(order, withReceipt);
    } catch {
      Alert.alert(
        'Gagal',
        selectedCustomer
          ? 'Transaksi gagal. Coba lagi, atau cek limit kredit pelanggan ini.'
          : 'Transaksi gagal, coba lagi.',
      );
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <View>
      <Text weight="bold" size="lg" style={styles.modalTitle}>
        💳 Selesaikan Pembayaran
      </Text>
      <View style={styles.checkoutTotalBox}>
        <View style={styles.checkoutTotalRow}>
          <Text size="sm" color="secondary">
            Subtotal
          </Text>
          <Text size="sm" weight="semibold">
            {formatRupiah(total)}
          </Text>
        </View>
        {discountAmount > 0 ? (
          <View style={styles.checkoutTotalRow}>
            <Text size="sm" color="secondary">
              Diskon
            </Text>
            <Text size="sm" weight="semibold" color="link">
              −{formatRupiah(discountAmount)}
            </Text>
          </View>
        ) : null}
        {taxAmount > 0 ? (
          <View style={styles.checkoutTotalRow}>
            <Text size="sm" color="secondary">
              PPN
            </Text>
            <Text size="sm" weight="semibold">
              {formatRupiah(taxAmount)}
            </Text>
          </View>
        ) : null}
        <View style={styles.checkoutTotalRow}>
          <Text weight="bold">Total dibayar</Text>
          <Heading level="h4">{formatRupiah(payableTotal)}</Heading>
        </View>
      </View>

      <ScrollView style={{ maxHeight: height * 0.4 }} showsVerticalScrollIndicator={false}>
        {lockPaymentControls ? (
          <Text size="sm" color="secondary" style={styles.lockedMethodHint}>
            Metode pembayaran:{' '}
            <Text weight="semibold" size="sm">
              {PAYMENT_METHODS.find((m) => m.value === paymentMethod)?.label ?? paymentMethod}
            </Text>
          </Text>
        ) : (
          <>
            <FormControl label="Metode pembayaran" isRequired>
              <View style={styles.paymentMethodRow}>
                {PAYMENT_METHODS.map((method) => {
                  const active = paymentMethod === method.value;
                  return (
                    <Pressable
                      key={method.value}
                      onPress={() => setPaymentMethod(method.value)}
                      style={[styles.paymentChip, active && styles.paymentChipActive]}
                    >
                      <Text size="sm" weight="semibold" color={active ? 'inverse' : 'secondary'}>
                        {method.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </FormControl>

            <FormControl label="Diskon (opsional)" helperText="Potongan harga langsung dalam Rupiah">
              <Input keyboardType="numeric" value={discount} onChangeText={setDiscount} placeholder="0" />
            </FormControl>
          </>
        )}

        {customers.length > 0 ? (
          <FormControl
            label="Pelanggan (opsional)"
            helperText="Pilih kalau mau catat sebagian/seluruh belanja sebagai utang pelanggan"
          >
            <Select
              value={customerId ?? NO_CUSTOMER}
              onChange={(v) => setCustomerId(v === NO_CUSTOMER ? null : v)}
              options={[
                { label: 'Tanpa pelanggan (transaksi umum)', value: NO_CUSTOMER },
                ...customers.map((c) => ({
                  label: c.balance > 0 ? `${c.name} (utang ${formatRupiah(c.balance)})` : c.name,
                  value: c.id,
                })),
              ]}
            />
          </FormControl>
        ) : null}

        {paymentMethod === 'CASH' ? (
          <View style={styles.presetRow}>
            {CASH_PRESETS.map((preset) => (
              <Pressable
                key={preset}
                style={styles.presetChip}
                onPress={() => setPaymentAmount(String(preset))}
              >
                <Text size="xs" weight="semibold" color="secondary">
                  {formatRupiah(preset)}
                </Text>
              </Pressable>
            ))}
            <Pressable style={styles.presetChip} onPress={() => setPaymentAmount(String(payableTotal))}>
              <Text size="xs" weight="semibold" color="link">
                Uang Pas
              </Text>
            </Pressable>
            {selectedCustomer ? (
              <Pressable style={styles.presetChip} onPress={() => setPaymentAmount('0')}>
                <Text size="xs" weight="semibold" color="error">
                  Utang Penuh
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <FormControl label="Jumlah dibayar" isRequired helperText="Isi jumlah uang yang diterima dari pembeli">
          <Input keyboardType="numeric" value={paymentAmount} onChangeText={setPaymentAmount} />
        </FormControl>

        {showItemsList ? (
          <View style={styles.itemsSection}>
            <Text weight="semibold" size="sm" color="secondary" style={styles.itemsSectionTitle}>
              Item Dipilih ({cartItems.length})
            </Text>
            {cartItems.map((item) => (
              <CartItemRow key={`${item.product.id}-${item.unitId}`} item={item} />
            ))}
          </View>
        ) : null}
      </ScrollView>

      {remainingAsDebt > 0 ? (
        <View style={styles.debtBox}>
          <Text weight="semibold" color="danger">
            Sisa jadi utang {selectedCustomer?.name}
          </Text>
          <Text weight="bold" size="lg" color="danger">
            {formatRupiah(remainingAsDebt)}
          </Text>
        </View>
      ) : (
        <View style={styles.changeBox}>
          <Text weight="semibold">Kembalian</Text>
          <Text weight="bold" size="lg" color={change > 0 ? 'success' : 'secondary'}>
            {formatRupiah(change)}
          </Text>
        </View>
      )}

      <VStack space="sm">
        <Button
          fullWidth
          onPress={() => onSubmit(true)}
          loading={submitting === 'receipt'}
          disabled={submitting_}
        >
          Simpan & Bagikan Struk
        </Button>
        <Button
          fullWidth
          variant="outline"
          onPress={() => onSubmit(false)}
          loading={submitting === 'plain'}
          disabled={submitting_}
        >
          Simpan Tanpa Struk
        </Button>
        <Button variant="ghost" onPress={onCancel} disabled={submitting_}>
          Batal
        </Button>
      </VStack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  topBarSubtitle: { marginTop: 2 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockBox: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
  },
  userBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  userName: { maxWidth: 140 },
  scanButtonTablet: { marginLeft: spacing.sm },
  searchWrap: { flexDirection: 'row', paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  searchIcon: { marginRight: spacing.xs },
  searchInput: { flex: 1 },
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
  categoryRow: { paddingHorizontal: spacing.md, paddingBottom: spacing.sm, gap: spacing.sm },
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
  body: { flex: 1, flexDirection: 'row' },
  gridList: { flex: 1 },
  grid: { paddingHorizontal: spacing.md, paddingBottom: 96 },
  gridTabletPadding: { paddingBottom: spacing.md },
  gridRow: { gap: spacing.md },
  sidePanel: {
    width: 340,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: colors.border,
    backgroundColor: colors.surface,
  },
  sidePanelInner: { flex: 1, padding: spacing.base },
  sidePanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sidePanelList: { maxHeight: 260, marginTop: spacing.xs },
  sidePanelEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
  sidePanelEmptyText: { marginTop: spacing.xs, textAlign: 'center' },
  summaryDivider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.xs },
  discountLabel: { marginTop: spacing.sm, marginBottom: spacing.xs },
  discountRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'stretch' },
  discountTypeToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  discountInput: { flex: 1 },
  ppnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  ppnRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  paymentMethodLabel: { marginTop: spacing.base, marginBottom: spacing.xs },
  paymentMethodGrid: { flexDirection: 'row', gap: spacing.sm },
  paymentMethodBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  paymentMethodBoxActive: { borderColor: colors.primary[600], backgroundColor: colors.primary[50] },
  payButton: { marginTop: spacing.base },
  clearCartButton: { marginTop: spacing.sm },
  card: { flex: 1, minHeight: 170, marginBottom: spacing.md, overflow: 'hidden' },
  cardImageWrap: { width: '100%', height: 110, position: 'relative' },
  cardImage: { width: '100%', height: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  cardImagePlaceholder: {
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.xs,
    backgroundColor: 'rgba(7,60,100,0.75)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 9999,
    maxWidth: '70%',
  },
  cardBody: { padding: spacing.sm, flex: 1, justifyContent: 'space-between' },
  cardName: { minHeight: 38 },
  cardFooter: { marginTop: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonDisabled: { backgroundColor: colors.gray[300] },
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
  cartRow: {
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cartRowTop: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  cartRowName: { flex: 1 },
  cartRowBottom: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing.xs },
  trashButton: { padding: spacing.xs },
  stepperButton: {
    width: 26,
    height: 26,
    borderRadius: 8,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQty: { minWidth: 16, textAlign: 'center' },
  modalTitle: { marginBottom: spacing.base },
  unitPickerHint: { marginBottom: spacing.base },
  openSessionHint: { marginBottom: spacing.base },
  unitChoice: { marginBottom: spacing.sm },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { minWidth: 90 },
  checkoutTotalBox: {
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    padding: spacing.base,
    marginBottom: spacing.base,
    gap: spacing.xs,
  },
  checkoutTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  lockedMethodHint: { marginBottom: spacing.base },
  paymentMethodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  paymentChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
  },
  paymentChipActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.base },
  presetChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  itemsSection: { marginTop: spacing.sm },
  itemsSectionTitle: { marginBottom: spacing.xs },
  changeBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  debtBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: spacing.sm,
    padding: spacing.sm,
    borderRadius: radii.md,
    backgroundColor: colors.error[50],
  },
});
