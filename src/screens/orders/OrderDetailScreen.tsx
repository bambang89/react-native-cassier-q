import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCurrentOrder, fetchOrder, voidOrder } from '@/store/slices/ordersSlice';
import type { RootStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { Button, FormControl, TextArea } from '@/components/ui/forms';
import { Badge, Divider } from '@/components/ui/dataDisplay';
import { Modal } from '@/components/ui/overlay';
import { AppBar } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'OrderDetail'>;

const STATUS_LABEL: Record<string, string> = { PAID: 'Lunas', VOID: 'Dibatalkan' };

function money(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export default function OrderDetailScreen({ navigation, route }: Props) {
  const { orderId } = route.params;
  const dispatch = useAppDispatch();
  const order = useAppSelector((state) => state.orders.current);
  const currentStatus = useAppSelector((state) => state.orders.currentStatus);
  const [voidModalVisible, setVoidModalVisible] = useState(false);

  useEffect(() => {
    dispatch(fetchOrder(orderId));
    return () => {
      dispatch(clearCurrentOrder());
    };
  }, [dispatch, orderId]);

  return (
    <View style={styles.container}>
      <AppBar title={order?.transactionNumber ?? 'Detail Transaksi'} onBack={navigation.goBack} />

      {currentStatus === 'loading' || !order ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          <View style={styles.headerRow}>
            <Text color="secondary" size="sm">
              {new Date(order.transactionDate).toLocaleString('id-ID')}
            </Text>
            <Badge variant={order.status === 'PAID' ? 'success' : order.status === 'VOID' ? 'error' : 'neutral'}>
              {STATUS_LABEL[order.status] ?? order.status}
            </Badge>
          </View>
          <Text size="xs" color="muted" style={styles.cashier}>
            Kasir: {order.cashierName}
          </Text>

          <Divider spacingY="base" />

          {order.items.map((item, index) => (
            <View key={`${item.productId}-${index}`} style={styles.itemRow}>
              <View style={styles.itemInfo}>
                <Text weight="medium">{item.productName}</Text>
                <Text size="xs" color="secondary">
                  {item.quantity} {item.unitName} × {money(item.unitPrice)}
                </Text>
              </View>
              <Text weight="semibold">{money(item.subtotal)}</Text>
            </View>
          ))}

          <Divider spacingY="base" />

          <SummaryRow label="Subtotal" value={order.subtotal} />
          {order.discountAmount > 0 ? <SummaryRow label="Diskon" value={-order.discountAmount} /> : null}
          {order.taxAmount > 0 ? <SummaryRow label="Pajak" value={order.taxAmount} /> : null}
          <SummaryRow label="Total" value={order.grandTotal} bold />
          <SummaryRow label="Dibayar" value={order.paymentAmount} />
          <SummaryRow label="Kembalian" value={order.changeAmount} />

          {order.voidReason ? (
            <Text size="sm" color="error" style={styles.voidReason}>
              Dibatalkan: {order.voidReason}
            </Text>
          ) : null}

          {order.status === 'PAID' ? (
            <Button variant="danger" style={styles.voidButton} onPress={() => setVoidModalVisible(true)}>
              Batalkan Transaksi
            </Button>
          ) : null}
        </ScrollView>
      )}

      <Modal isOpen={voidModalVisible} onClose={() => setVoidModalVisible(false)}>
        <VoidForm
          orderId={orderId}
          onDone={() => setVoidModalVisible(false)}
          onCancel={() => setVoidModalVisible(false)}
        />
      </Modal>
    </View>
  );
}

function SummaryRow({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <View style={styles.summaryRow}>
      <Text color="secondary" weight={bold ? 'semibold' : 'regular'}>
        {label}
      </Text>
      <Text weight={bold ? 'bold' : 'medium'}>{money(value)}</Text>
    </View>
  );
}

function VoidForm({
  orderId,
  onDone,
  onCancel,
}: {
  orderId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const dispatch = useAppDispatch();
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await dispatch(voidOrder({ id: orderId, reason: reason.trim() })).unwrap();
      onDone();
    } catch {
      Alert.alert('Gagal', 'Transaksi tidak bisa dibatalkan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text weight="semibold" size="lg" style={styles.modalTitle}>
        Batalkan Transaksi
      </Text>
      <FormControl label="Alasan pembatalan" isRequired>
        <TextArea value={reason} onChangeText={setReason} placeholder="mis. salah input, barang dikembalikan" />
      </FormControl>
      <View style={styles.modalActions}>
        <Button variant="ghost" onPress={onCancel} style={styles.modalAction}>
          Batal
        </Button>
        <Button variant="danger" onPress={onSubmit} loading={submitting} disabled={!reason.trim()} style={styles.modalAction}>
          Ya, Batalkan
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cashier: { marginTop: spacing.xs },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  itemInfo: { flex: 1, marginRight: spacing.sm },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  voidReason: { marginTop: spacing.base },
  voidButton: { marginTop: spacing.xl },
  modalTitle: { marginBottom: spacing.base },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { minWidth: 90 },
});
