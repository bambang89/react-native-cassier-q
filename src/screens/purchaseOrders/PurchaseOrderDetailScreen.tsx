import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  cancelPurchaseOrder,
  clearCurrentPurchaseOrder,
  fetchPurchaseOrder,
  receivePurchaseOrder,
} from '@/store/slices/purchaseOrdersSlice';
import type { ReceiveItemPayload } from '@/api/purchaseOrdersApi';
import { hasAnyReceived, isCancelled, isFullyReceived, poStatusMeta, remainingToReceive } from '@/utils/purchaseOrders';
import type { RootStackParamList } from '@/navigation/types';
import type { PurchaseOrder } from '@/types/models';
import { colors, spacing } from '@/theme';
import { Button, Input } from '@/components/ui/forms';
import { Badge, Divider } from '@/components/ui/dataDisplay';
import { AlertDialog, Modal } from '@/components/ui/overlay';
import { AppBar, Card } from '@/components/ui/recipes';
import { ReceiptIcon, ReceiveIcon, StickyNoteIcon } from '@/components/icons/LineIcons';
import { Heading, Text } from '@/components/ui/typography';
import { VStack } from '@/components/ui/layout';

type Props = NativeStackScreenProps<RootStackParamList, 'PurchaseOrderDetail'>;

export default function PurchaseOrderDetailScreen({ navigation, route }: Props) {
  const { purchaseOrderId } = route.params;
  const dispatch = useAppDispatch();
  const po = useAppSelector((state) => state.purchaseOrders.current);
  const currentStatus = useAppSelector((state) => state.purchaseOrders.currentStatus);
  const [receiveVisible, setReceiveVisible] = useState(false);
  const [cancelConfirmVisible, setCancelConfirmVisible] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    dispatch(fetchPurchaseOrder(purchaseOrderId));
    return () => {
      dispatch(clearCurrentPurchaseOrder());
    };
  }, [dispatch, purchaseOrderId]);

  if (!po || po.id !== purchaseOrderId) {
    return (
      <View style={styles.container}>
        <AppBar title="Purchase Order" onBack={navigation.goBack} />
        <View style={styles.center}>
          <Text color="muted">{currentStatus === 'loading' ? 'Memuat...' : 'PO tidak ditemukan.'}</Text>
        </View>
      </View>
    );
  }

  const meta = poStatusMeta(po);
  const cancellable = !isCancelled(po) && !isFullyReceived(po) && !hasAnyReceived(po);
  const receivable = !isCancelled(po) && !isFullyReceived(po);

  const onCancel = async () => {
    setCancelling(true);
    try {
      await dispatch(cancelPurchaseOrder(po.id)).unwrap();
      setCancelConfirmVisible(false);
    } catch {
      Alert.alert('Gagal', 'PO tidak bisa dibatalkan (mungkin sudah ada barang yang diterima).');
      setCancelConfirmVisible(false);
    } finally {
      setCancelling(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppBar title={po.poNumber} onBack={navigation.goBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <Card>
          <View style={styles.headerRow}>
            <View style={styles.headerInfo}>
              <Text weight="bold" size="lg">
                {po.supplierName}
              </Text>
              <Text size="sm" color="secondary">
                Dibuat {new Date(po.orderDate).toLocaleDateString('id-ID')}
                {po.expectedDate ? ` · Diharapkan datang ${po.expectedDate}` : ''}
              </Text>
            </View>
            <Badge variant={meta.variant}>{meta.label}</Badge>
          </View>
          {po.notes ? (
            <View style={styles.notesRow}>
              <StickyNoteIcon size={13} color={colors.text.muted} />
              <Text size="sm" color="muted" style={styles.notes}>
                {po.notes}
              </Text>
            </View>
          ) : null}
        </Card>

        <Card style={styles.totalCard}>
          <Text size="sm" color="secondary">
            Total pembelian
          </Text>
          <Heading level="h3">Rp {po.totalCost.toLocaleString('id-ID')}</Heading>
        </Card>

        <View style={styles.sectionTitleRow}>
          <ReceiptIcon size={16} color={colors.text.secondary} />
          <Text weight="bold" size="lg">
            Barang
          </Text>
        </View>
        <Card padding="none" shadow="sm">
          {po.items.map((item, index) => {
            const remaining = remainingToReceive(item);
            return (
              <View key={item.id}>
                {index > 0 ? <Divider /> : null}
                <View style={styles.itemRow}>
                  <View style={styles.itemInfo}>
                    <Text weight="semibold" numberOfLines={1}>
                      {item.productName}
                    </Text>
                    <Text size="xs" color="secondary">
                      {item.quantity} {item.unitName} × Rp {item.unitCost.toLocaleString('id-ID')}
                    </Text>
                    <Text size="xs" color={remaining > 0 ? 'warning' : 'success'}>
                      {remaining > 0
                        ? `Diterima ${(item.quantity - remaining).toLocaleString('id-ID')} / ${item.quantity} ${item.unitName}`
                        : `Sudah diterima penuh (${item.quantity} ${item.unitName})`}
                    </Text>
                  </View>
                  <Text weight="bold">Rp {item.subtotal.toLocaleString('id-ID')}</Text>
                </View>
              </View>
            );
          })}
        </Card>

        {receivable ? (
          <Button
            style={styles.actionButton}
            leftIcon={<ReceiveIcon size={16} color={colors.white} />}
            onPress={() => setReceiveVisible(true)}
          >
            Terima Barang
          </Button>
        ) : null}
        {cancellable ? (
          <Button variant="outline" style={styles.actionButton} onPress={() => setCancelConfirmVisible(true)}>
            Batalkan PO
          </Button>
        ) : null}
        {!cancellable && !isCancelled(po) && !isFullyReceived(po) ? (
          <Text size="xs" color="muted" align="center" style={styles.cancelHint}>
            PO ini tidak bisa dibatalkan lagi karena sudah ada barang yang diterima.
          </Text>
        ) : null}
      </ScrollView>

      <Modal isOpen={receiveVisible} onClose={() => setReceiveVisible(false)}>
        <ReceiveForm po={po} onDone={() => setReceiveVisible(false)} onCancel={() => setReceiveVisible(false)} />
      </Modal>

      <AlertDialog
        isOpen={cancelConfirmVisible}
        onClose={() => setCancelConfirmVisible(false)}
        title="Batalkan purchase order ini?"
        description={`PO ${po.poNumber} ke ${po.supplierName} akan dibatalkan.`}
        confirmText="Batalkan"
        isDanger
        onConfirm={onCancel}
      />
    </View>
  );
}

function ReceiveForm({ po, onDone, onCancel }: { po: PurchaseOrder; onDone: () => void; onCancel: () => void }) {
  const dispatch = useAppDispatch();
  const pendingItems = po.items.filter((item) => remainingToReceive(item) > 0);
  const [amounts, setAmounts] = useState<Record<string, string>>(() =>
    Object.fromEntries(pendingItems.map((item) => [item.id, String(remainingToReceive(item))])),
  );
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const items: ReceiveItemPayload[] = pendingItems
      .map((item) => ({ purchaseOrderItemId: item.id, receivedQuantity: Number(amounts[item.id] || 0) }))
      .filter((entry) => entry.receivedQuantity > 0);
    if (items.length === 0) {
      Alert.alert('Belum ada jumlah', 'Isi jumlah yang diterima untuk minimal satu barang.');
      return;
    }
    setSubmitting(true);
    try {
      await dispatch(receivePurchaseOrder({ id: po.id, items })).unwrap();
      onDone();
    } catch {
      Alert.alert('Gagal', 'Penerimaan barang tidak bisa disimpan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <View style={styles.modalTitleRow}>
        <ReceiveIcon size={16} color={colors.text.primary} />
        <Text weight="semibold" size="lg">
          Terima Barang
        </Text>
      </View>
      <Text size="sm" color="secondary" style={styles.modalHint}>
        Isi jumlah barang yang benar-benar datang. Boleh sebagian — sisanya tetap tercatat sebagai belum diterima.
      </Text>
      <VStack space="md">
        {pendingItems.map((item) => (
          <View key={item.id}>
            <Text weight="semibold" size="sm">
              {item.productName}
            </Text>
            <Text size="xs" color="muted" style={styles.remainingHint}>
              Sisa {remainingToReceive(item).toLocaleString('id-ID')} {item.unitName}
            </Text>
            <Input
              keyboardType="numeric"
              value={amounts[item.id] ?? ''}
              onChangeText={(v) => setAmounts((prev) => ({ ...prev, [item.id]: v }))}
              placeholder="0"
            />
          </View>
        ))}
      </VStack>
      <View style={styles.modalActions}>
        <Button variant="ghost" onPress={onCancel} style={styles.modalAction}>
          Batal
        </Button>
        <Button onPress={onSubmit} loading={submitting} style={styles.modalAction}>
          Simpan
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: spacing.sm },
  headerInfo: { flex: 1 },
  notesRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginTop: spacing.sm },
  notes: { flex: 1 },
  totalCard: { marginTop: spacing.md },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.sm,
  },
  itemInfo: { flex: 1, gap: 2 },
  actionButton: { marginTop: spacing.md },
  cancelHint: { marginTop: spacing.sm },
  modalTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  modalHint: { marginBottom: spacing.base },
  remainingHint: { marginBottom: spacing.xs },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.base },
  modalAction: { minWidth: 90 },
});
