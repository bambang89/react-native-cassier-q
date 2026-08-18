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
  selectCartCount,
  selectCartTotal,
} from '@/store/slices/cartSlice';
import type { AddItemPayload } from '@/store/slices/cartSlice';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import type { CartItem, Order, Product, ProductUnit } from '@/types/models';
import { PAYMENT_METHODS, type PaymentMethod } from '@/types/models';
import { resolveSaleUnitChoices } from '@/utils/productUnits';
import { emojiForProduct, paletteColorFor } from '@/utils/productDisplay';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, radii, spacing } from '@/theme';
import { Button, FormControl, Input, Pressable, Select, Switch } from '@/components/ui/forms';
import { Modal } from '@/components/ui/overlay';
import { Card, EmptyState, Header, TabletTopBar } from '@/components/ui/recipes';
import { Heading, Text } from '@/components/ui/typography';
import { VStack } from '@/components/ui/layout';
import {
  BarcodeIcon,
  BoxIcon,
  CartIcon,
  ChevronDownIcon,
  ClockIcon,
  CreditCardIcon,
  DiscountIcon,
  NoteIcon,
  SearchIcon,
  TrashIcon,
  UnlockIcon,
} from '@/components/icons/LineIcons';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'POS'>,
  NativeStackScreenProps<RootStackParamList>
>;

const LOW_STOCK_THRESHOLD = 5;

const CASH_PRESETS = [50000, 100000, 150000, 200000];

const PPN_RATE = 0.11;

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

function sessionTimeLabel(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }).replace(':', '.');
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
  const [discountModalVisible, setDiscountModalVisible] = useState(false);
  const [unitPicker, setUnitPicker] = useState<{ product: Product; choices: ProductUnit[] } | null>(null);

  // Kontrol diskon/PPN hidup di sini supaya panel "Pesanan Saat Ini" (tablet)
  // bisa menampilkannya di ringkasan sebelum kasir menekan Bayar.
  const [discountType, setDiscountType] = useState<'percent' | 'amount'>('percent');
  const [discountValue, setDiscountValue] = useState('');
  const [ppnEnabled, setPpnEnabled] = useState(true);

  const searchInputRef = useRef<RNTextInputRef>(null);

  useEffect(() => {
    if (status === 'idle') dispatch(fetchProducts({}));
    dispatch(fetchCurrentSession());
    dispatch(fetchCategories());
    dispatch(fetchCustomers());
    dispatch(fetchStoreProfile());
  }, [status, dispatch]);

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

  const onHoldOrder = () => {
    Alert.alert('Segera hadir', 'Fitur menahan pesanan untuk dilanjutkan nanti belum tersedia.');
  };

  const onAddNote = () => {
    Alert.alert('Segera hadir', 'Fitur catatan pesanan belum tersedia.');
  };

  const renderProduct = ({ item }: { item: Product }) => (
    <ProductCard item={item} onPress={() => onAddToCart(item)} />
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {isTabletLandscape ? (
        <TabletTopBar
          title="Kasir"
          subtitle={session ? `Sesi dibuka ${sessionTimeLabel(session.openedAt)}` : 'Sesi belum dibuka'}
          storeName={storeName}
          userName={user?.name ?? 'Kasir'}
        />
      ) : (
        <Header
          title={`${greetingForNow()}, ${user?.name?.split(' ')[0] ?? 'Kasir'}! 👋`}
          subtitle={todayLabel()}
          rightElement={
            <Button
              size="sm"
              leftIcon={<BarcodeIcon size={16} color={colors.white} />}
              onPress={() =>
                navigation.navigate('Scanner', {
                  onFound: (product) => onAddToCart(product),
                })
              }
            >
              Scan
            </Button>
          }
        />
      )}

      {sessionStatus !== 'loading' && !session ? (
        <View style={styles.sessionBanner}>
          <View style={styles.sessionBannerGlyph}>
            <UnlockIcon size={18} color={colors.warning[600]} />
          </View>
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
            placeholder={isTabletLandscape ? 'Cari produk atau scan barcode' : 'Cari produk (F2)'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftElement={<SearchIcon size={17} color={colors.text.muted} strokeWidth={1.7} />}
          />
        </View>
        <Pressable
          style={styles.scanIconButton}
          accessibilityLabel="Scan barcode"
          onPress={() =>
            navigation.navigate('Scanner', {
              onFound: (product) => onAddToCart(product),
            })
          }
        >
          <BarcodeIcon size={19} color={colors.text.secondary} />
        </Pressable>
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

      <View style={styles.body}>
        <FlatList
          key={isTabletLandscape ? 'grid-3' : 'grid-2'}
          data={filteredProducts}
          keyExtractor={(item) => item.id}
          renderItem={renderProduct}
          numColumns={isTabletLandscape ? 3 : 2}
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
                icon={BoxIcon}
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
            <OrderPanel
              cashierName={user?.name ?? 'Kasir'}
              cartItems={cartItems}
              cartCount={cartCount}
              subtotal={subtotal}
              discountAmount={discountAmount}
              taxAmount={taxAmount}
              grandTotal={grandTotal}
              canCheckout={canOpenCheckout}
              onCheckout={openCheckout}
              onClearCart={onClearCart}
              onOpenDiscount={() => setDiscountModalVisible(true)}
              onHold={onHoldOrder}
              onAddNote={onAddNote}
            />
          </View>
        ) : null}
      </View>

      {!isTabletLandscape && cartCount > 0 ? (
        <View style={styles.cartBar}>
          <View>
            <View style={styles.cartLabelRow}>
              <CartIcon size={12} color={colors.gray[300]} />
              <Text size="xs" style={styles.cartLabel}>
                {cartCount} item di keranjang
              </Text>
            </View>
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

      <Modal isOpen={discountModalVisible} onClose={() => setDiscountModalVisible(false)}>
        <DiscountForm
          discountType={discountType}
          onChangeDiscountType={() => setDiscountType((prev) => (prev === 'percent' ? 'amount' : 'percent'))}
          discountValue={discountValue}
          onChangeDiscountValue={setDiscountValue}
          ppnEnabled={ppnEnabled}
          onChangePpnEnabled={setPpnEnabled}
          onDone={() => setDiscountModalVisible(false)}
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
  const thumbnailColor = paletteColorFor(item.id);

  return (
    <Card padding="none" style={styles.card} onPress={outOfStock ? undefined : onPress}>
      <View style={[styles.cardImageWrap, !item.imageUrl && { backgroundColor: thumbnailColor }]}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        ) : (
          <Text size="4xl">{emojiForProduct(item)}</Text>
        )}
      </View>
      <View style={styles.cardBody}>
        <Text weight="semibold" numberOfLines={2} style={styles.cardName}>
          {item.productName}
        </Text>
        <View style={styles.cardFooter}>
          <Text weight="bold">{formatRupiah(item.sellingPrice)}</Text>
          <Text size="xs" weight="semibold" color={stockColor}>
            {outOfStock ? 'Stok habis' : `Stok ${item.stockQuantity}`}
          </Text>
        </View>
      </View>
    </Card>
  );
}

function QtyStepper({ item }: { item: CartItem }) {
  const dispatch = useAppDispatch();
  return (
    <View style={styles.stepper}>
      <Pressable
        style={styles.stepperButton}
        onPress={() => dispatch(decrementItem(item.product.id))}
        accessibilityLabel="Kurangi jumlah"
      >
        <Text weight="bold">−</Text>
      </Pressable>
      <View style={styles.stepperQtyBox}>
        <Text weight="bold">{item.quantity}</Text>
      </View>
      <Pressable
        style={styles.stepperButton}
        onPress={() => dispatch(incrementItem(item.product.id))}
        accessibilityLabel="Tambah jumlah"
      >
        <Text weight="bold">+</Text>
      </Pressable>
    </View>
  );
}

function CartItemRow({ item }: { item: CartItem }) {
  const unitPrice = item.product.sellingPrice * item.unitConversionToBase;
  const thumbnailColor = paletteColorFor(item.product.id);
  return (
    <View style={styles.cartRow}>
      <View style={[styles.cartRowThumbnail, { backgroundColor: thumbnailColor }]}>
        <Text size="lg">{emojiForProduct(item.product)}</Text>
      </View>
      <View style={styles.cartRowInfo}>
        <Text weight="semibold" numberOfLines={1}>
          {item.product.productName}
        </Text>
        <Text size="xs" color="muted">
          {formatRupiah(unitPrice)}
        </Text>
      </View>
      <QtyStepper item={item} />
    </View>
  );
}

function OrderPanel({
  cashierName,
  cartItems,
  cartCount,
  subtotal,
  discountAmount,
  taxAmount,
  grandTotal,
  canCheckout,
  onCheckout,
  onClearCart,
  onOpenDiscount,
  onHold,
  onAddNote,
}: {
  cashierName: string;
  cartItems: CartItem[];
  cartCount: number;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  canCheckout: boolean;
  onCheckout: () => void;
  onClearCart: () => void;
  onOpenDiscount: () => void;
  onHold: () => void;
  onAddNote: () => void;
}) {
  return (
    <VStack style={styles.sidePanelInner}>
      <View style={styles.sidePanelHeader}>
        <View style={styles.sidePanelHeaderText}>
          <Heading level="h4">Pesanan Saat Ini</Heading>
          <Text size="xs" color="secondary">
            {cartCount} item · Kasir: {cashierName}
          </Text>
        </View>
        {cartCount > 0 ? (
          <Pressable style={styles.clearIconButton} onPress={onClearCart} accessibilityLabel="Hapus keranjang">
            <TrashIcon size={15} color={colors.text.secondary} />
          </Pressable>
        ) : null}
      </View>

      {cartItems.length > 0 ? (
        <ScrollView style={styles.sidePanelList} showsVerticalScrollIndicator={false}>
          {cartItems.map((item) => (
            <CartItemRow key={`${item.product.id}-${item.unitId}`} item={item} />
          ))}
        </ScrollView>
      ) : (
        <View style={styles.sidePanelEmpty}>
          <View style={styles.sidePanelEmptyGlyph}>
            <CartIcon size={22} color={colors.primary[600]} />
          </View>
          <Text color="muted" size="sm" style={styles.sidePanelEmptyText}>
            Belum ada item, ketuk produk untuk menambahkan.
          </Text>
        </View>
      )}

      <View style={styles.summaryDivider} />

      <View style={styles.summaryRow}>
        <Text color="secondary">Subtotal</Text>
        <Text weight="semibold">{formatRupiah(subtotal)}</Text>
      </View>
      {discountAmount > 0 ? (
        <View style={styles.summaryRow}>
          <Text color="secondary">Diskon</Text>
          <Text weight="semibold" color="success">
            − {formatRupiah(discountAmount)}
          </Text>
        </View>
      ) : null}
      {taxAmount > 0 ? (
        <View style={styles.summaryRow}>
          <Text color="secondary">Pajak (11%)</Text>
          <Text weight="semibold">{formatRupiah(taxAmount)}</Text>
        </View>
      ) : null}

      <View style={styles.totalRow}>
        <Heading level="h5">Total</Heading>
        <Heading level="h4">{formatRupiah(grandTotal)}</Heading>
      </View>

      <View style={styles.actionRow}>
        <Pressable style={styles.actionButton} onPress={onHold}>
          <ClockIcon size={14} color={colors.text.secondary} />
          <Text size="xs" weight="semibold" color="secondary">
            Tahan
          </Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={onOpenDiscount}>
          <DiscountIcon size={14} color={colors.text.secondary} />
          <Text size="xs" weight="semibold" color="secondary">
            Diskon
          </Text>
        </Pressable>
        <Pressable style={styles.actionButton} onPress={onAddNote}>
          <NoteIcon size={14} color={colors.text.secondary} />
          <Text size="xs" weight="semibold" color="secondary">
            Catatan
          </Text>
        </Pressable>
      </View>

      <Button fullWidth disabled={!canCheckout} onPress={onCheckout} style={styles.payButton}>
        {`Bayar Sekarang · ${formatRupiah(grandTotal)}`}
      </Button>
    </VStack>
  );
}

function DiscountForm({
  discountType,
  onChangeDiscountType,
  discountValue,
  onChangeDiscountValue,
  ppnEnabled,
  onChangePpnEnabled,
  onDone,
}: {
  discountType: 'percent' | 'amount';
  onChangeDiscountType: () => void;
  discountValue: string;
  onChangeDiscountValue: (value: string) => void;
  ppnEnabled: boolean;
  onChangePpnEnabled: (value: boolean) => void;
  onDone: () => void;
}) {
  return (
    <View>
      <Text weight="bold" size="lg" style={styles.modalTitle}>
        % Diskon & Pajak
      </Text>

      <Text weight="semibold" size="sm" style={styles.discountLabel}>
        Diskon (F7)
      </Text>
      <View style={styles.discountRow}>
        <Pressable style={styles.discountTypeToggle} onPress={onChangeDiscountType}>
          <Text weight="semibold" size="sm">
            {discountType === 'percent' ? '%' : 'Rp'}
          </Text>
          <ChevronDownIcon size={12} color={colors.text.muted} />
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
        <Switch value={ppnEnabled} onValueChange={onChangePpnEnabled} />
      </View>

      <Button fullWidth onPress={onDone} style={styles.payButton}>
        Selesai
      </Button>
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
      <View style={styles.modalTitleRow}>
        <UnlockIcon size={17} color={colors.text.primary} />
        <Text weight="bold" size="lg">
          Buka Sesi Kasir
        </Text>
      </View>
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
}: {
  total: number;
  cartItems: CartItem[];
  showItemsList: boolean;
  onDone: (order: Order, withReceipt: boolean) => void;
  onCancel: () => void;
  /** Kalau diisi, panel "Pesanan Saat Ini" (tablet) sudah menentukan diskon/pajak lewat
   * modal Diskon — modal ini cuma menampilkannya sebagai ringkasan, bukan input lagi. */
  externalDiscountAmount?: number;
  externalTaxAmount?: number;
}) {
  const dispatch = useAppDispatch();
  const { height } = useResponsive();
  const customers = useAppSelector((state) => state.customers.items);
  const lockDiscount = externalDiscountAmount !== undefined;
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [discount, setDiscount] = useState('');
  const taxAmount = externalTaxAmount ?? 0;
  const discountAmount = lockDiscount
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
      <View style={styles.modalTitleRow}>
        <CreditCardIcon size={17} color={colors.text.primary} />
        <Text weight="bold" size="lg">
          Selesaikan Pembayaran
        </Text>
      </View>
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

        {!lockDiscount ? (
          <FormControl label="Diskon (opsional)" helperText="Potongan harga langsung dalam Rupiah">
            <Input keyboardType="numeric" value={discount} onChangeText={setDiscount} placeholder="0" />
          </FormControl>
        ) : null}

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
  searchWrap: { flexDirection: 'row', paddingHorizontal: spacing.base, marginBottom: spacing.sm, gap: spacing.sm },
  searchInput: { flex: 1 },
  scanIconButton: {
    width: 50,
    height: 50,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.borderStrong,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
  sessionBannerGlyph: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    backgroundColor: colors.warning[100],
    alignItems: 'center',
    justifyContent: 'center',
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
  sidePanelHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  sidePanelHeaderText: { flex: 1 },
  clearIconButton: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  sidePanelList: { maxHeight: 260, marginTop: spacing.sm },
  sidePanelEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.xl },
  sidePanelEmptyGlyph: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    marginBottom: spacing.lg,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  actionRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.base },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  payButton: { marginTop: spacing.base },
  card: { flex: 1, minHeight: 170, marginBottom: spacing.md, overflow: 'hidden' },
  cardImageWrap: {
    width: '100%',
    height: 110,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  cardImage: { width: '100%', height: '100%', borderTopLeftRadius: 8, borderTopRightRadius: 8 },
  cardBody: { padding: spacing.sm, flex: 1, justifyContent: 'space-between' },
  cardName: { minHeight: 38 },
  cardFooter: { marginTop: spacing.sm, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
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
  cartLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  cartLabel: { color: colors.gray[300] },
  cartText: { color: colors.white },
  cartRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  cartRowThumbnail: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartRowInfo: { flex: 1 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  stepperButton: {
    width: 26,
    height: 26,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperQtyBox: {
    minWidth: 26,
    height: 26,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xs,
  },
  modalTitle: { marginBottom: spacing.base },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.base },
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
