import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Platform, ScrollView, View } from 'react-native';
import type { TextInput as RNTextInputRef } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchProducts } from '@/store/slices/productsSlice';
import { fetchProductUnits } from '@/store/slices/productUnitsSlice';
import { fetchCategories } from '@/store/slices/categoriesSlice';
import { fetchCustomers } from '@/store/slices/customersSlice';
import { fetchCurrentSession } from '@/store/slices/cashierSessionSlice';
import { fetchStoreProfile } from '@/store/slices/storeProfileSlice';
import { addItem, clearCart, selectCartCount, selectCartTotal } from '@/store/slices/cartSlice';
import type { AddItemPayload } from '@/store/slices/cartSlice';
import type { Order, Product, ProductUnit } from '@/types/models';
import { resolveSaleUnitChoices } from '@/utils/productUnits';
import { useResponsive } from '@/hooks/useResponsive';
import { colors } from '@/theme';
import { tabletColors } from '@/theme/tabletColors';
import { Button, Input, Pressable } from '@/components/ui/forms';
import { Modal } from '@/components/ui/overlay';
import { EmptyState, Header, TabletTopBar } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { BarcodeIcon, BoxIcon, CartIcon, SearchIcon, UnlockIcon } from '@/components/icons/LineIcons';

import type { POSScreenProps } from './POSScreen.types';
import { styles } from './POSScreen.styles';
import { formatRupiah, greetingForNow, PPN_RATE, sessionTimeLabel, todayLabel } from './POSScreen.utils';
import {
  CategoryChip,
  CheckoutForm,
  DiscountForm,
  OpenSessionForm,
  OrderPanel,
  ProductCard,
} from './components';

export default function POSScreen({ navigation }: POSScreenProps) {
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
    <ProductCard item={item} onPress={() => onAddToCart(item)} tablet={isTabletLandscape} />
  );

  // Search + kategori + grid produk dirender sebagai satu unit supaya, di mode
  // tablet, kolom ini sejajar penuh dengan OrderPanel (lihat styles.body di
  // bawah) — persis .tpos-left/.tpos-right di tablet-pos.html, bukan cuma
  // OrderPanel sejajar dengan grid-nya saja.
  const productBrowser = (
    <>
      <View style={[styles.searchWrap, isTabletLandscape && styles.searchWrapTablet]}>
        <View style={styles.searchInput}>
          <Input
            ref={searchInputRef}
            placeholder={isTabletLandscape ? 'Cari produk atau scan barcode' : 'Cari produk (F2)'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftElement={
              <SearchIcon size={17} color={isTabletLandscape ? tabletColors.gray400 : colors.text.muted} strokeWidth={1.7} />
            }
          />
        </View>
        <Pressable
          style={[styles.scanIconButton, isTabletLandscape && styles.scanIconButtonTablet]}
          accessibilityLabel="Scan barcode"
          onPress={() =>
            navigation.navigate('Scanner', {
              onFound: (product) => onAddToCart(product),
            })
          }
        >
          <BarcodeIcon size={19} color={isTabletLandscape ? tabletColors.gray600 : colors.text.secondary} />
        </Pressable>
      </View>

      {categories.length > 0 ? (
        <ScrollView
          horizontal
          style={{ maxHeight: 60 }}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.categoryRow, isTabletLandscape && styles.categoryRowTablet]}
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
        key={isTabletLandscape ? 'grid-3' : 'grid-2'}
        data={filteredProducts}
        keyExtractor={(item) => item.id}
        renderItem={renderProduct}
        numColumns={isTabletLandscape ? 3 : 2}
        contentContainerStyle={[styles.grid, isTabletLandscape && styles.gridTabletPadding]}
        columnWrapperStyle={[styles.gridRow, isTabletLandscape && styles.gridRowTablet]}
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
    </>
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

      {isTabletLandscape ? (
        <View style={styles.body}>
          <View style={styles.leftColumn}>{productBrowser}</View>
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
        </View>
      ) : (
        <View style={styles.leftColumn}>{productBrowser}</View>
      )}

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
