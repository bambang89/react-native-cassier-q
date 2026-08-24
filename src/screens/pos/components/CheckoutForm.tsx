import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createOrder } from '@/store/slices/ordersSlice';
import { fetchCustomers } from '@/store/slices/customersSlice';
import type { CartItem, Order } from '@/types/models';
import { PAYMENT_METHODS, type PaymentMethod } from '@/types/models';
import { useResponsive } from '@/hooks/useResponsive';
import { colors } from '@/theme';
import { Button, FormControl, Input, Pressable, Select } from '@/components/ui/forms';
import { Heading, Text } from '@/components/ui/typography';
import { VStack } from '@/components/ui/layout';
import { CreditCardIcon } from '@/components/icons/LineIcons';

import { styles } from '../POSScreen.styles';
import { CASH_PRESETS, formatRupiah, NO_CUSTOMER } from '../POSScreen.utils';
import { CartItemRow } from './CartItemRow';

export function CheckoutForm({
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
