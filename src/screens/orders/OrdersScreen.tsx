import { useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearReceipt, fetchOrders, fetchReceipt } from '@/store/slices/ordersSlice';
import { fetchStoreProfile } from '@/store/slices/storeProfileSlice';
import { useResponsive } from '@/hooks/useResponsive';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import type { Order, OrderStatus, Receipt } from '@/types/models';
import { colors, radii, spacing } from '@/theme';
import { tabletColors } from '@/theme/tabletColors';
import { paymentMethodLabel } from '@/utils/receiptText';
import { Badge } from '@/components/ui/dataDisplay';
import { Card, EmptyState, Header, KpiCard, SplitItem, TabletSplitView, TabletTopBar } from '@/components/ui/recipes';
import { Modal } from '@/components/ui/overlay';
import { Pressable } from '@/components/ui/forms';
import { PrintIcon, ReceiptIcon, RefundIcon } from '@/components/icons/LineIcons';
import { Text } from '@/components/ui/typography';
import { VoidForm } from './OrderDetailScreen';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Orders'>,
  NativeStackScreenProps<RootStackParamList>
>;

const STATUS_VARIANT: Record<string, 'success' | 'error' | 'neutral'> = {
  PAID: 'success',
  VOID: 'error',
};

const STATUS_LABEL: Record<string, string> = {
  PAID: 'Lunas',
  VOID: 'Dibatalkan',
};

function statusLabel(status: OrderStatus) {
  return STATUS_LABEL[status] ?? status;
}

function money(value: number) {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export default function OrdersScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { isTabletLandscape } = useResponsive();
  const { items, page, totalPages, totalElements, status } = useAppSelector((state) => state.orders);
  const receipt = useAppSelector((state) => state.orders.receipt);
  const receiptStatus = useAppSelector((state) => state.orders.receiptStatus);
  const user = useAppSelector((state) => state.auth.user);
  const storeProfile = useAppSelector((state) => state.storeProfile.profile);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [voidModalVisible, setVoidModalVisible] = useState(false);

  const primaryRole = user?.roles?.[0] ?? null;
  const storeName = storeProfile?.storeName ?? primaryRole?.storeName ?? '-';

  useEffect(() => {
    dispatch(fetchOrders({ page: 0 }));
    dispatch(fetchStoreProfile());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  useEffect(() => {
    if (isTabletLandscape && !selectedOrderId && items.length > 0) {
      setSelectedOrderId(items[0].id);
    }
  }, [isTabletLandscape, items, selectedOrderId]);

  useEffect(() => {
    if (!isTabletLandscape || !selectedOrderId) return;
    dispatch(fetchReceipt(selectedOrderId));
    return () => {
      dispatch(clearReceipt());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isTabletLandscape, selectedOrderId]);

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return items;
    return items.filter((item) => item.transactionNumber.toLowerCase().includes(q));
  }, [items, searchQuery]);

  if (isTabletLandscape) {
    return (
      <SafeAreaView style={[styles.container, styles.containerTablet]} edges={['top', 'left', 'right']}>
        <TabletTopBar
          title="Transaksi"
          subtitle={`${totalElements.toLocaleString('id-ID')} transaksi hari ini`}
          storeName={storeName}
          userName={user?.name ?? 'Kasir'}
        />
        <TabletSplitView
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Cari transaksi"
          detail={
            <OrderDetailPane
              order={items.find((o) => o.id === selectedOrderId) ?? null}
              receipt={receiptStatus === 'succeeded' ? receipt : null}
              loading={receiptStatus === 'loading'}
              onReprint={() => selectedOrderId && navigation.navigate('Receipt', { orderId: selectedOrderId })}
              onRefund={() => setVoidModalVisible(true)}
            />
          }
        >
          {filteredItems.map((item) => (
            <SplitItem
              key={item.id}
              active={item.id === selectedOrderId}
              onPress={() => setSelectedOrderId(item.id)}
              title={item.transactionNumber}
              amount={money(item.grandTotal)}
              meta={`${new Date(item.transactionDate).toLocaleString('id-ID')} · ${statusLabel(item.status)}`}
            />
          ))}
        </TabletSplitView>

        <Modal isOpen={voidModalVisible} onClose={() => setVoidModalVisible(false)}>
          {selectedOrderId ? (
            <VoidForm
              orderId={selectedOrderId}
              onDone={() => {
                setVoidModalVisible(false);
                dispatch(fetchOrders({ page: 0 }));
                dispatch(fetchReceipt(selectedOrderId));
              }}
              onCancel={() => setVoidModalVisible(false)}
            />
          ) : null}
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header title="Riwayat Transaksi" />

      {totalElements > 0 ? (
        <View style={styles.statsRow}>
          <KpiCard
            icon={ReceiptIcon}
            iconColor={colors.primary[600]}
            iconBg={colors.primary[50]}
            label="Total Transaksi"
            value={totalElements.toLocaleString('id-ID')}
          />
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={() => dispatch(fetchOrders({ page: 0 }))}
        refreshing={status === 'loading' && page === 0}
        onEndReached={() => {
          if (status !== 'loading' && page + 1 < totalPages) dispatch(fetchOrders({ page: page + 1 }));
        }}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card
            shadow="none"
            style={styles.card}
            onPress={() => navigation.navigate('OrderDetail', { orderId: item.id })}
          >
            <View style={styles.row}>
              <View style={styles.info}>
                <Text weight="semibold">{item.transactionNumber}</Text>
                <Text size="xs" color="secondary">
                  {new Date(item.transactionDate).toLocaleString('id-ID')}
                </Text>
              </View>
              <View style={styles.right}>
                <Text weight="bold">Rp {item.grandTotal.toLocaleString('id-ID')}</Text>
                <Badge variant={STATUS_VARIANT[item.status] ?? 'neutral'}>{statusLabel(item.status)}</Badge>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          status === 'loading' ? (
            <Text color="muted" align="center" style={styles.empty}>
              Memuat transaksi...
            </Text>
          ) : (
            <EmptyState
              icon={ReceiptIcon}
              title="Belum Ada Transaksi"
              description="Riwayat penjualan bakal muncul di sini setelah kamu mencatat transaksi pertama di kasir."
            />
          )
        }
      />
    </SafeAreaView>
  );
}

// Pane kanan split-view — struktur persis .split-detail di
// cassier-q-webapp/tablet-transactions.html (badge, kartu info 2x2, tabel item,
// ringkasan, tombol Cetak Ulang/Refund).
function OrderDetailPane({
  order,
  receipt,
  loading,
  onReprint,
  onRefund,
}: {
  order: Order | null;
  receipt: Receipt | null;
  loading: boolean;
  onReprint: () => void;
  onRefund: () => void;
}) {
  if (!order) {
    return (
      <View style={styles.detailEmpty}>
        <Text color="muted">Pilih transaksi di daftar untuk melihat detail.</Text>
      </View>
    );
  }

  return (
    <View style={styles.detailPad}>
      <View style={styles.detailHeadRow}>
        <View>
          <Text style={styles.detailNumber}>#{order.transactionNumber}</Text>
          <Text style={styles.detailDate}>{new Date(order.transactionDate).toLocaleString('id-ID')}</Text>
        </View>
        <Badge variant={STATUS_VARIANT[order.status] ?? 'neutral'}>{statusLabel(order.status)}</Badge>
      </View>

      {loading || !receipt ? (
        <Text color="muted" style={styles.detailLoading}>
          Memuat detail transaksi...
        </Text>
      ) : (
        <>
          <View style={styles.infoCard}>
            <View style={styles.infoGrid}>
              <InfoCell label="Pelanggan" value={receipt.customerName ?? 'Umum'} />
              <InfoCell label="Kasir" value={receipt.cashierName} />
              <InfoCell label="Metode Pembayaran" value={paymentMethodLabel(receipt.paymentMethod)} />
              <InfoCell label="Outlet" value={receipt.storeName ?? '-'} />
            </View>
          </View>

          <View style={styles.itemsCard}>
            <Text style={styles.itemsCardTitle}>Item Pesanan</Text>
            <View style={styles.itemsTableHead}>
              <Text style={[styles.itemsTableHeadCell, styles.itemsColProduct]}>Produk</Text>
              <Text style={[styles.itemsTableHeadCell, styles.itemsColQty]}>Qty</Text>
              <Text style={[styles.itemsTableHeadCell, styles.itemsColPrice]}>Harga</Text>
            </View>
            {receipt.items.map((item, index) => (
              <View key={`${item.productName}-${index}`} style={styles.itemsRow}>
                <Text style={[styles.itemsCellMain, styles.itemsColProduct]} numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text style={[styles.itemsCell, styles.itemsColQty]}>{item.quantity}</Text>
                <Text style={[styles.itemsCell, styles.itemsColPrice]}>{money(item.subtotal)}</Text>
              </View>
            ))}

            <View style={styles.itemsSummary}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>Subtotal</Text>
                <Text style={styles.summaryValue}>{money(receipt.subtotal)}</Text>
              </View>
              {receipt.discountAmount > 0 ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Diskon</Text>
                  <Text style={[styles.summaryValue, { color: tabletColors.emerald600 }]}>
                    − {money(receipt.discountAmount)}
                  </Text>
                </View>
              ) : null}
              {receipt.taxAmount > 0 ? (
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Pajak</Text>
                  <Text style={styles.summaryValue}>{money(receipt.taxAmount)}</Text>
                </View>
              ) : null}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total</Text>
                <Text style={styles.totalValue}>{money(receipt.grandTotal)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.detailActions}>
            <Pressable style={styles.detailActionButton} onPress={onReprint}>
              <PrintIcon size={15} color={tabletColors.gray700} />
              <Text style={styles.detailActionLabel}>Cetak Ulang</Text>
            </Pressable>
            {order.status === 'PAID' ? (
              <Pressable style={styles.detailActionButton} onPress={onRefund}>
                <RefundIcon size={15} color={tabletColors.gray700} />
                <Text style={styles.detailActionLabel}>Refund</Text>
              </Pressable>
            ) : null}
          </View>
        </>
      )}
    </View>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoCell}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  containerTablet: { backgroundColor: tabletColors.gray25 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  empty: { marginTop: spacing['3xl'] },

  // Split-detail (mode tablet) — persis .split-detail di tablet-transactions.html.
  detailEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  detailPad: { padding: 26 },
  detailHeadRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 },
  detailNumber: { fontSize: 22, fontWeight: '800', color: tabletColors.gray900 },
  detailDate: { fontSize: 12.5, color: tabletColors.gray500, marginTop: 4 },
  detailLoading: { marginTop: spacing.lg },
  infoCard: {
    backgroundColor: tabletColors.white,
    borderWidth: 1,
    borderColor: tabletColors.gray150,
    borderRadius: radii.lg,
    padding: 20,
    marginBottom: 16,
  },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  infoCell: { width: '45%' },
  infoLabel: { fontSize: 11.5, color: tabletColors.gray500, fontWeight: '600' },
  infoValue: { fontSize: 13.5, fontWeight: '700', color: tabletColors.gray900, marginTop: 3 },
  itemsCard: {
    backgroundColor: tabletColors.white,
    borderWidth: 1,
    borderColor: tabletColors.gray150,
    borderRadius: radii.lg,
  },
  itemsCardTitle: { fontSize: 15, fontWeight: '700', color: tabletColors.gray900, padding: 20, paddingBottom: 12 },
  itemsTableHead: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 8 },
  itemsTableHeadCell: { fontSize: 11.5, fontWeight: '700', color: tabletColors.gray500, textTransform: 'uppercase' },
  itemsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: tabletColors.gray100,
  },
  itemsCellMain: { fontSize: 13, fontWeight: '600', color: tabletColors.gray900 },
  itemsCell: { fontSize: 13, color: tabletColors.gray700 },
  itemsColProduct: { flex: 1 },
  itemsColQty: { width: 50 },
  itemsColPrice: { width: 100, textAlign: 'right' },
  itemsSummary: { padding: 20, paddingTop: 14, borderTopWidth: 1, borderTopColor: tabletColors.gray150 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  summaryLabel: { fontSize: 13, color: tabletColors.gray600 },
  summaryValue: { fontSize: 13, color: tabletColors.gray600 },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: tabletColors.gray150,
  },
  totalLabel: { fontSize: 14, fontWeight: '700', color: tabletColors.gray900 },
  totalValue: { fontSize: 19, fontWeight: '800', color: tabletColors.gray900 },
  detailActions: { flexDirection: 'row', gap: 10, marginTop: 16 },
  detailActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    minHeight: 46,
    paddingHorizontal: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: tabletColors.gray300,
    backgroundColor: tabletColors.white,
  },
  detailActionLabel: { fontSize: 13.5, fontWeight: '600', color: tabletColors.gray700 },
});
