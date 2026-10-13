import { Fragment, useEffect, useRef, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { newIdempotencyKey } from '@/api/errors';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createOrder } from '@/store/slices/ordersSlice';
import * as promoCodesApi from '@/api/promoCodesApi';
import { apiErrorMessage } from '@/api/errors';
import { fetchCurrentSession } from '@/store/slices/cashierSessionSlice';
import { fetchCustomers } from '@/store/slices/customersSlice';
import type { CartItem, Order, PromoQuote } from '@/types/models';
import { PAYMENT_METHODS, type PaymentMethod } from '@/types/models';
import { useResponsive } from '@/hooks/useResponsive';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radii, spacing } from '@/theme';
import { Button, Pressable, Select } from '@/components/ui/forms';
import { Text } from '@/components/ui/typography';
import { VStack } from '@/components/ui/layout';
import {
  CheckIcon,
  CreditCardIcon,
  DiscountIcon,
  PeopleIcon,
  PrintIcon,
} from '@/components/icons/LineIcons';

import { styles } from '../POSScreen.styles';
import { cashSuggestions, formatRupiah, NO_CUSTOMER, PPN_RATE } from '../POSScreen.utils';
import { CartItemRow } from './CartItemRow';
import { PAYMENT_METHOD_ICONS } from '@/screens/settings/paymentMethodIcons';
import { usePermissions } from '@/hooks/usePermissions';

export function CheckoutForm({
  total,
  cartItems,
  showItemsList,
  onDone,
  onCancel,
  externalDiscountAmount,
  layout = 'modal',
}: {
  total: number;
  cartItems: CartItem[];
  showItemsList: boolean;
  onDone: (order: Order, withReceipt: boolean) => void;
  onCancel: () => void;
  /** Kalau diisi, panel "Pesanan Saat Ini" (tablet) sudah menentukan diskon manual lewat
   * modal Diskon — modal ini cuma menampilkannya sebagai ringkasan, bukan input lagi. */
  externalDiscountAmount?: number;
  /** 'page' = full checkout screen on phones: no inner title, scrollable body, footer pinned to the bottom. */
  layout?: 'modal' | 'page';
}) {
  const dispatch = useAppDispatch();
  const { height } = useResponsive();
  const insets = useSafeAreaInsets();
  const isPage = layout === 'page';
  const customers = useAppSelector((state) => state.customers.items);
  const settings = useAppSelector((state) => state.checkoutSettings.settings);
  // Hak Akses Menu → Kasir: manual discount and promo codes each need their own permission.
  const { can } = usePermissions();
  const canDiscount = can('pos.discount');
  const canPromo = can('pos.promo');
  const lockDiscount = externalDiscountAmount !== undefined;
  // Only the methods the store owner enabled (cash until the settings arrive).
  const methods = settings
    ? PAYMENT_METHODS.filter((m) => settings.paymentMethods.some((s) => s.code === m.value && s.enabled))
    : PAYMENT_METHODS.filter((m) => m.value === 'CASH');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(settings?.defaultPaymentMethod ?? 'CASH');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [discount, setDiscount] = useState('');
  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState<PromoQuote | null>(null);
  const [promoChecking, setPromoChecking] = useState(false);
  const [promoError, setPromoError] = useState<string | null>(null);
  const manualDiscount = lockDiscount
    ? (externalDiscountAmount ?? 0)
    : Math.min(total, Math.max(0, Number(discount || 0)));
  const promoDiscount = Math.min(promo?.discountAmount ?? 0, total - manualDiscount);
  const discountAmount = manualDiscount + promoDiscount;
  // PPN follows the store setting (Pengaturan → Pembayaran & PPN), not a cashier toggle.
  const taxEnabled = settings?.taxEnabled ?? true;
  const taxRate = settings ? settings.taxRatePercent / 100 : PPN_RATE;
  const taxAmount = taxEnabled ? Math.round((total - discountAmount) * taxRate) : 0;
  const payableTotal = total - discountAmount + taxAmount;
  const [paymentAmount, setPaymentAmount] = useState(String(payableTotal));
  const [submitting, setSubmitting] = useState<'receipt' | 'plain' | null>(null);
  // Satu key per checkout ini: kalau request pertama timeout padahal sudah
  // tercatat di server, menekan bayar lagi mengembalikan transaksi yang sama.
  const idempotencyKey = useRef(newIdempotencyKey());

  // Total berubah (diskon / promo / PPN) → jumlah bayar ikut menyesuaikan.
  useEffect(() => {
    setPaymentAmount(String(payableTotal));
  }, [payableTotal]);

  // Settings loaded after opening → preselect the store's default method.
  useEffect(() => {
    if (settings && !methods.some((m) => m.value === paymentMethod)) {
      setPaymentMethod(settings.defaultPaymentMethod);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  // A changed manual discount changes the promo base — check the applied code again.
  useEffect(() => {
    if (!promo) return;
    promoCodesApi
      .validatePromoCode(promo.code, total - manualDiscount)
      .then(setPromo)
      .catch((error) => {
        setPromo(null);
        setPromoError(apiErrorMessage(error, 'Kode promo tidak berlaku lagi.'));
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [total, manualDiscount]);

  /** Checks the typed promo code against the cart and applies it. */
  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoChecking(true);
    setPromoError(null);
    try {
      setPromo(await promoCodesApi.validatePromoCode(code, total - manualDiscount));
      setPromoInput('');
    } catch (error) {
      setPromoError(apiErrorMessage(error, 'Kode promo tidak bisa dipakai.'));
    } finally {
      setPromoChecking(false);
    }
  };

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
            // Manual discount only — the server recomputes the promo part from promoCode.
            discountAmount: manualDiscount > 0 ? manualDiscount : undefined,
            taxAmount: taxAmount > 0 ? taxAmount : undefined,
            promoCode: promo?.code,
            customerId: selectedCustomer?.id,
          },
          idempotencyKey: idempotencyKey.current,
        }),
      ).unwrap();
      if (selectedCustomer) dispatch(fetchCustomers());
      onDone(order, withReceipt);
    } catch (error) {
      // The session may have been auto-closed at 23:00 — refresh it so the POS shows the right state.
      dispatch(fetchCurrentSession());
      Alert.alert('Gagal', typeof error === 'string' ? error : 'Transaksi gagal, coba lagi.');
    } finally {
      setSubmitting(null);
    }
  };

  const itemCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const isCash = paymentMethod === 'CASH';
  const shortfall = !selectedCustomer ? Math.max(0, payableTotal - amountNumber) : 0;
  const quickAmounts = cashSuggestions(payableTotal);

  /** Switches the payment method; non-cash payments default to the exact total. */
  const selectMethod = (method: PaymentMethod) => {
    setPaymentMethod(method);
    if (method !== 'CASH') setPaymentAmount(String(payableTotal));
  };

  return (
    <View style={isPage ? local.page : undefined}>
      {isPage ? null : (
        <View style={local.header}>
          <View style={local.headerIcon}>
            <CreditCardIcon size={18} color={colors.primary[600]} />
          </View>
          <View style={local.headerText}>
            <Text weight="bold" size="lg">
              Selesaikan Pembayaran
            </Text>
            <Text size="xs" color="muted">
              {cartItems.length} produk · {itemCount} item
            </Text>
          </View>
        </View>
      )}

      <ScrollView
        style={isPage ? local.pageScroll : { maxHeight: height * 0.42 }}
        contentContainerStyle={isPage ? local.pageContent : undefined}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Ringkasan tagihan */}
        <View style={local.billCard}>
          <Text size="xs" weight="semibold" style={local.billLabel}>
            TOTAL TAGIHAN
          </Text>
          <Text style={local.billTotal}>{formatRupiah(payableTotal)}</Text>
          <View style={local.billDivider} />
          <View style={local.billRow}>
            <Text size="sm" style={local.billMuted}>
              Subtotal
            </Text>
            <Text size="sm" weight="semibold" style={local.billValue}>
              {formatRupiah(total)}
            </Text>
          </View>
          {manualDiscount > 0 ? (
            <View style={local.billRow}>
              <Text size="sm" style={local.billMuted}>
                Diskon
              </Text>
              <Text size="sm" weight="semibold" style={local.billDiscount}>
                −{formatRupiah(manualDiscount)}
              </Text>
            </View>
          ) : null}
          {promo ? (
            <View style={local.billRow}>
              <Text size="sm" style={local.billMuted}>
                Promo {promo.code}
              </Text>
              <Text size="sm" weight="semibold" style={local.billDiscount}>
                −{formatRupiah(promoDiscount)}
              </Text>
            </View>
          ) : null}
          {taxAmount > 0 ? (
            <View style={local.billRow}>
              <Text size="sm" style={local.billMuted}>
                PPN {settings?.taxRatePercent ?? 11}%
              </Text>
              <Text size="sm" weight="semibold" style={local.billValue}>
                {formatRupiah(taxAmount)}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Metode pembayaran */}
        <Text size="xs" weight="semibold" color="muted" style={local.sectionLabel}>
          METODE PEMBAYARAN
        </Text>
        <View style={local.methodGrid}>
          {methods.map((method) => {
            const active = paymentMethod === method.value;
            const Icon = PAYMENT_METHOD_ICONS[method.value] ?? CreditCardIcon;
            return (
              <Pressable
                key={method.value}
                onPress={() => selectMethod(method.value)}
                style={[local.methodTile, active && local.methodTileActive]}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
              >
                <Icon size={18} color={active ? colors.primary[600] : colors.gray[500]} />
                <Text size="xs" weight="semibold" style={active ? local.methodLabelActive : local.methodLabel}>
                  {method.label}
                </Text>
                {active ? (
                  <View style={local.methodCheck}>
                    <CheckIcon size={10} color={colors.white} />
                  </View>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* Uang diterima */}
        <Text size="xs" weight="semibold" color="muted" style={local.sectionLabel}>
          {isCash ? 'UANG DITERIMA' : 'JUMLAH DIBAYAR'}
        </Text>
        <View style={local.amountBox}>
          <Text weight="bold" style={local.amountPrefix}>
            Rp
          </Text>
          <TextInput
            value={paymentAmount}
            onChangeText={(v) => setPaymentAmount(v.replace(/[^0-9]/g, ''))}
            keyboardType="number-pad"
            style={local.amountInput}
            selectTextOnFocus
            accessibilityLabel="Jumlah dibayar"
          />
        </View>
        {isCash ? (
          <View style={local.quickRow}>
            <Pressable
              style={[local.quickChip, amountNumber === payableTotal && local.quickChipActive]}
              onPress={() => setPaymentAmount(String(payableTotal))}
            >
              <Text size="xs" weight="semibold" style={local.quickExact}>
                Uang Pas
              </Text>
            </Pressable>
            {quickAmounts.map((value) => (
              <Pressable
                key={value}
                style={[local.quickChip, amountNumber === value && local.quickChipActive]}
                onPress={() => setPaymentAmount(String(value))}
              >
                <Text size="xs" weight="semibold" color="secondary">
                  {formatRupiah(value)}
                </Text>
              </Pressable>
            ))}
            {selectedCustomer ? (
              <Pressable style={local.quickChip} onPress={() => setPaymentAmount('0')}>
                <Text size="xs" weight="semibold" color="error">
                  Utang Penuh
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : (
          <Text size="xs" color="muted" style={local.hint}>
            Pastikan pembayaran {methods.find((m) => m.value === paymentMethod)?.label} sudah berhasil sebelum menyimpan.
          </Text>
        )}

        {canPromo ? (
        <Fragment>
        {/* Kode promo */}
        <Text size="xs" weight="semibold" color="muted" style={local.sectionLabel}>
          KODE PROMO
        </Text>
        {promo ? (
          <View style={local.promoApplied}>
            <View style={local.promoBadge}>
              <DiscountIcon size={16} color={colors.success[700]} />
            </View>
            <View style={local.optionBody}>
              <Text weight="bold" style={local.promoCode}>
                {promo.code}
              </Text>
              <Text size="xs" color="secondary">
                {promo.description} · hemat {formatRupiah(promoDiscount)}
              </Text>
            </View>
            <Pressable onPress={() => setPromo(null)} hitSlop={8} accessibilityLabel="Hapus kode promo">
              <Text size="xs" weight="semibold" color="error">
                Hapus
              </Text>
            </Pressable>
          </View>
        ) : (
          <View style={local.promoRow}>
            <TextInput
              value={promoInput}
              onChangeText={(v) => {
                setPromoInput(v.replace(/[^A-Za-z0-9_-]/g, '').toUpperCase());
                setPromoError(null);
              }}
              placeholder="Masukkan kode promo"
              placeholderTextColor={colors.gray[400]}
              autoCapitalize="characters"
              autoCorrect={false}
              returnKeyType="done"
              onSubmitEditing={applyPromo}
              style={local.promoInput}
              accessibilityLabel="Kode promo"
            />
            <Button size="sm" onPress={applyPromo} loading={promoChecking} disabled={!promoInput.trim() || promoChecking}>
              Pakai
            </Button>
          </View>
        )}
        {promoError ? (
          <Text size="xs" color="error" style={local.promoError}>
            {promoError}
          </Text>
        ) : (
          <View style={local.promoSpacer} />
        )}
        </Fragment>
        ) : null}

        {/* Opsi tambahan */}
        {(!lockDiscount && canDiscount) || customers.length > 0 ? (
          <Fragment>
            <Text size="xs" weight="semibold" color="muted" style={local.sectionLabel}>
              OPSI TAMBAHAN
            </Text>
            <View style={local.optionsCard}>
              {!lockDiscount && canDiscount ? (
                <View style={local.optionRow}>
                  <View style={local.optionIcon}>
                    <DiscountIcon size={15} color={colors.gray[600]} />
                  </View>
                  <View style={local.optionBody}>
                    <Text size="sm" weight="semibold">
                      Diskon
                    </Text>
                    <Text size="xs" color="muted">
                      Potongan langsung dalam Rupiah
                    </Text>
                  </View>
                  <TextInput
                    value={discount}
                    onChangeText={(v) => setDiscount(v.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    placeholder="0"
                    placeholderTextColor={colors.gray[400]}
                    style={local.optionInput}
                    accessibilityLabel="Diskon"
                  />
                </View>
              ) : null}
              {customers.length > 0 ? (
                <View style={[local.optionColumn, !lockDiscount && canDiscount && local.optionDivider]}>
                  <View style={local.optionRowInline}>
                    <View style={local.optionIcon}>
                      <PeopleIcon size={15} color={colors.gray[600]} />
                    </View>
                    <View style={local.optionBody}>
                      <Text size="sm" weight="semibold">
                        Pelanggan
                      </Text>
                      <Text size="xs" color="muted">
                        Wajib dipilih bila sebagian dicatat sebagai utang
                      </Text>
                    </View>
                  </View>
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
                </View>
              ) : null}
            </View>
          </Fragment>
        ) : null}

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

      <View style={isPage ? [local.pageFooter, { paddingBottom: insets.bottom + spacing.sm }] : undefined}>
        {/* Status pembayaran */}
        {remainingAsDebt > 0 ? (
          <View style={[local.statusBar, local.statusDebt]}>
            <Text size="sm" weight="semibold" style={local.statusDebtText}>
              Sisa jadi utang {selectedCustomer?.name}
            </Text>
            <Text weight="bold" size="lg" style={local.statusDebtText}>
              {formatRupiah(remainingAsDebt)}
            </Text>
          </View>
        ) : shortfall > 0 ? (
          <View style={[local.statusBar, local.statusShort]}>
            <Text size="sm" weight="semibold" color="error">
              Uang kurang
            </Text>
            <Text weight="bold" size="lg" color="error">
              {formatRupiah(shortfall)}
            </Text>
          </View>
        ) : (
          <View style={[local.statusBar, local.statusChange]}>
            <Text size="sm" weight="semibold" style={local.statusChangeText}>
              Kembalian
            </Text>
            <Text weight="bold" size="lg" style={local.statusChangeText}>
              {formatRupiah(change)}
            </Text>
          </View>
        )}

        <VStack space="sm">
          <Button
            fullWidth
            leftIcon={<PrintIcon size={16} color={colors.white} />}
            onPress={() => onSubmit(true)}
            loading={submitting === 'receipt'}
            disabled={submitting_ || shortfall > 0}
          >
            {`Bayar ${formatRupiah(payableTotal)} & Struk`}
          </Button>
          <View style={local.secondaryRow}>
            <Button variant="ghost" onPress={onCancel} disabled={submitting_} style={local.secondaryButton}>
              Batal
            </Button>
            <Button
              variant="outline"
              onPress={() => onSubmit(false)}
              loading={submitting === 'plain'}
              disabled={submitting_ || shortfall > 0}
              style={local.secondaryButton}
            >
              Tanpa Struk
            </Button>
          </View>
        </VStack>
      </View>
    </View>
  );
}


const local = StyleSheet.create({
  page: { flex: 1 },
  pageScroll: { flex: 1 },
  pageContent: { padding: spacing.base, paddingBottom: spacing.xl },
  pageFooter: {
    paddingHorizontal: spacing.base,
    paddingTop: spacing.xs,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.base },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
  },
  headerText: { flex: 1 },
  billCard: {
    padding: spacing.lg,
    borderRadius: radii.xl,
    backgroundColor: colors.darkBg,
    marginBottom: spacing.lg,
  },
  billLabel: { color: 'rgba(255,255,255,0.6)', letterSpacing: 1 },
  billTotal: { color: colors.white, fontSize: 30, lineHeight: 38, fontWeight: '800', marginTop: 2 },
  billDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: spacing.md },
  billRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 },
  billMuted: { color: 'rgba(255,255,255,0.65)' },
  billValue: { color: colors.white },
  billDiscount: { color: '#7EE2B8' },
  sectionLabel: { letterSpacing: 0.8, marginBottom: spacing.sm },
  methodGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  methodTile: {
    flexBasis: '31%',
    flexGrow: 1,
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  methodTileActive: { borderColor: colors.primary[600], backgroundColor: colors.primary[50] },
  methodLabel: { color: colors.text.secondary },
  methodLabelActive: { color: colors.primary[700] },
  methodCheck: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    borderRadius: radii.lg,
    borderWidth: 1.5,
    borderColor: colors.primary[200],
    backgroundColor: colors.background,
  },
  amountPrefix: { fontSize: 18, color: colors.text.secondary },
  amountInput: {
    flex: 1,
    paddingVertical: spacing.md,
    fontSize: 24,
    fontWeight: '700',
    color: colors.text.primary,
    fontFamily: undefined,
  },
  quickRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm, marginBottom: spacing.lg },
  quickChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  quickChipActive: { borderColor: colors.primary[600], backgroundColor: colors.primary[50] },
  quickExact: { color: colors.primary[600] },
  hint: { marginTop: spacing.sm, marginBottom: spacing.lg },
  optionsCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: spacing.base,
  },
  optionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  optionRowInline: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  optionColumn: { gap: spacing.sm, padding: spacing.md },
  optionDivider: { borderTopWidth: 1, borderTopColor: colors.border },
  optionIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
  },
  optionBody: { flex: 1 },
  optionInput: {
    width: 110,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  promoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  promoInput: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
    color: colors.primary[700],
  },
  promoApplied: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.success[300],
    backgroundColor: colors.success[50],
  },
  promoBadge: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  promoCode: { color: colors.success[700], letterSpacing: 1 },
  promoError: { marginTop: spacing.xs, marginBottom: spacing.lg },
  promoSpacer: { height: spacing.lg },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    marginVertical: spacing.md,
  },
  statusChange: { backgroundColor: colors.success[50] },
  statusChangeText: { color: colors.success[700] },
  statusShort: { backgroundColor: colors.error[50] },
  statusDebt: { backgroundColor: colors.warning[50] },
  statusDebtText: { color: colors.warning[700] },
  secondaryRow: { flexDirection: 'row', gap: spacing.sm },
  secondaryButton: { flex: 1 },
});
