import { useCallback, useState } from 'react';
import { Alert, FlatList, Linking, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

import * as productsApi from '@/api/productsApi';
import { changeOrderStatus, fetchCustomerOrders } from '@/api/customerOrdersApi';
import { apiErrorMessage } from '@/api/errors';
import type { CartItem } from '@/types/models';
import type { CustomerOrder, CustomerOrderStatus, Fulfillment } from '@/types/customerOrders';
import { useAppDispatch } from '@/store/hooks';
import { loadOrderIntoCart } from '@/store/slices/cartSlice';
import { usePermissions } from '@/hooks/usePermissions';
import { colors, radii, spacing } from '@/theme';
import { Badge, type BadgeVariant } from '@/components/ui/dataDisplay';
import { Button } from '@/components/ui/forms';
import { Modal } from '@/components/ui/overlay';
import { Card, EmptyState, Header } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { ClipboardIcon } from '@/components/icons/LineIcons';
import { FilterChips } from '@/screens/inventory/components/shared';

const POLL_MS = 15000;

type Tab = 'NEW' | 'PROGRESS' | 'READY' | 'DONE';

const TAB_STATUSES: Record<Exclude<Tab, 'DONE'>, CustomerOrderStatus[]> = {
  NEW: ['NEW'],
  PROGRESS: ['ACCEPTED', 'IN_PROGRESS'],
  READY: ['READY'],
};

const STATUS_META: Record<CustomerOrderStatus, { label: string; variant: BadgeVariant }> = {
  NEW: { label: 'Baru', variant: 'error' },
  ACCEPTED: { label: 'Dikonfirmasi', variant: 'primary' },
  IN_PROGRESS: { label: 'Diproses', variant: 'warning' },
  READY: { label: 'Siap', variant: 'success' },
  COMPLETED: { label: 'Selesai', variant: 'neutral' },
  CANCELLED: { label: 'Dibatalkan', variant: 'neutral' },
};

const FULFILLMENT_LABEL: Record<Fulfillment, string> = {
  PICKUP: 'Ambil di toko',
  DELIVERY: 'Diantar',
  DINE_IN: 'Makan di tempat',
  TAKEAWAY: 'Bawa pulang',
};

const ACTIVE: CustomerOrderStatus[] = ['NEW', 'ACCEPTED', 'IN_PROGRESS', 'READY'];

function nextAction(status: CustomerOrderStatus): { label: string; status: CustomerOrderStatus } | null {
  if (status === 'NEW') return { label: 'Terima', status: 'ACCEPTED' };
  if (status === 'ACCEPTED') return { label: 'Proses', status: 'IN_PROGRESS' };
  if (status === 'IN_PROGRESS') return { label: 'Tandai Siap', status: 'READY' };
  return null;
}

const rupiah = (value: number) => `Rp ${Math.round(value).toLocaleString('id-ID')}`;

function timeAgo(iso: string): string {
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (minutes < 1) return 'baru saja';
  if (minutes < 60) return `${minutes} mnt lalu`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} jam lalu`;
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
}

/** Menu Pesanan: antrian pesanan masuk dari toko online. */
export default function PesananScreen() {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const { can } = usePermissions();
  const canProcess = can('pesanan.process');
  const [tab, setTab] = useState<Tab>('NEW');
  const [active, setActive] = useState<CustomerOrder[]>([]);
  const [done, setDone] = useState<CustomerOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [selected, setSelected] = useState<CustomerOrder | null>(null);

  const load = useCallback(async () => {
    try {
      const [a, d] = await Promise.all([fetchCustomerOrders('ACTIVE', 0, 100), fetchCustomerOrders('DONE', 0, 50)]);
      setActive(a.content);
      setDone(d.content);
    } catch {
      // polling berikutnya akan mencoba lagi
    } finally {
      setLoading(false);
    }
  }, []);

  // Muat ulang tiap layar dibuka + polling selama layar aktif.
  useFocusEffect(
    useCallback(() => {
      load();
      const timer = setInterval(load, POLL_MS);
      return () => clearInterval(timer);
    }, [load]),
  );

  const act = async (order: CustomerOrder, status: CustomerOrderStatus) => {
    setBusyId(order.id);
    try {
      const updated = await changeOrderStatus(order.id, status);
      setSelected((s) => (s?.id === updated.id ? updated : s));
      await load();
    } catch (error) {
      Alert.alert('Gagal', apiErrorMessage(error, 'Status pesanan tidak bisa diubah.'));
    } finally {
      setBusyId(null);
    }
  };

  const cancel = (order: CustomerOrder) =>
    Alert.alert('Batalkan pesanan?', `${order.orderNumber} atas nama ${order.customerName} akan dibatalkan.`, [
      { text: 'Tidak', style: 'cancel' },
      { text: 'Batalkan', style: 'destructive', onPress: () => act(order, 'CANCELLED') },
    ]);

  /** "Bayar di Kasir": isi keranjang dengan item pesanan, lalu buka Kasir. */
  const pay = async (order: CustomerOrder) => {
    setPayingId(order.id);
    try {
      const page = await productsApi.fetchProducts({ size: 500 });
      const byId = new Map(page.content.map((p) => [p.id, p]));
      const missing = order.items.filter((i) => !byId.has(i.productId));
      if (missing.length) {
        Alert.alert('Produk tidak ditemukan', `${missing.map((m) => m.productName).join(', ')} sudah tidak aktif. Ubah pesanan secara manual di Kasir.`);
        return;
      }
      const items: CartItem[] = order.items.map((i) => {
        const product = byId.get(i.productId)!;
        return { product, unitId: product.baseUnitId, unitName: product.baseUnitName, unitConversionToBase: 1, quantity: Number(i.quantity) };
      });
      dispatch(loadOrderIntoCart({ items, order: { id: order.id, orderNumber: order.orderNumber, customerName: order.customerName } }));
      setSelected(null);
      navigation.navigate('Main', { screen: 'POS' });
    } catch (error) {
      Alert.alert('Gagal', apiErrorMessage(error, 'Produk pesanan tidak bisa dimuat ke Kasir.'));
    } finally {
      setPayingId(null);
    }
  };

  const countOf = (t: Exclude<Tab, 'DONE'>) => active.filter((o) => TAB_STATUSES[t].includes(o.status)).length;
  const list = tab === 'DONE' ? done : active.filter((o) => TAB_STATUSES[tab].includes(o.status));
  const newCount = countOf('NEW');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header title="Pesanan" subtitle={`${active.length} pesanan aktif${newCount ? ` · ${newCount} baru` : ''}`} />
      <View style={styles.filters}>
        <FilterChips<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'NEW', label: 'Baru', count: newCount },
            { value: 'PROGRESS', label: 'Diproses', count: countOf('PROGRESS') },
            { value: 'READY', label: 'Siap', count: countOf('READY') },
            { value: 'DONE', label: 'Riwayat' },
          ]}
        />
      </View>
      <FlatList
        data={list}
        keyExtractor={(o) => o.id}
        contentContainerStyle={styles.list}
        refreshing={false}
        onRefresh={load}
        renderItem={({ item }) => (
          <OrderCard
            order={item}
            canProcess={canProcess}
            busy={busyId === item.id}
            paying={payingId === item.id}
            onOpen={() => setSelected(item)}
            onAdvance={(status) => act(item, status)}
            onPay={() => pay(item)}
          />
        )}
        ListEmptyComponent={
          loading ? (
            <Text color="muted" align="center" style={styles.empty}>
              Memuat pesanan...
            </Text>
          ) : (
            <EmptyState
              icon={ClipboardIcon}
              title={tab === 'DONE' ? 'Belum ada riwayat' : 'Belum ada pesanan'}
              description={
                tab === 'DONE'
                  ? 'Pesanan yang selesai atau dibatalkan tampil di sini.'
                  : 'Pesanan dari toko online akan muncul di sini secara otomatis.'
              }
            />
          )
        }
      />

      <Modal isOpen={!!selected} onClose={() => setSelected(null)}>
        {selected ? (
          <OrderDetail
            order={selected}
            canProcess={canProcess}
            busy={busyId === selected.id}
            paying={payingId === selected.id}
            onAdvance={(status) => act(selected, status)}
            onCancel={() => cancel(selected)}
            onPay={() => pay(selected)}
            onClose={() => setSelected(null)}
          />
        ) : null}
      </Modal>
    </SafeAreaView>
  );
}

type CardProps = {
  order: CustomerOrder;
  canProcess: boolean;
  busy: boolean;
  paying: boolean;
  onAdvance: (status: CustomerOrderStatus) => void;
  onPay: () => void;
};

function OrderCard({ order, canProcess, busy, paying, onOpen, onAdvance, onPay }: CardProps & { onOpen: () => void }) {
  const meta = STATUS_META[order.status];
  const next = nextAction(order.status);
  const isNew = order.status === 'NEW';
  return (
    <Card shadow="none" onPress={onOpen} style={[styles.card, isNew && styles.cardNew]}>
      <View style={styles.row}>
        <View style={styles.flex}>
          <Text weight="bold" numberOfLines={1}>
            {order.customerName}
          </Text>
          <Text size="xs" color="muted">
            {order.orderNumber} · {timeAgo(order.createdAt)}
          </Text>
        </View>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </View>
      <Text size="sm" color="secondary" numberOfLines={2} style={styles.items}>
        {order.items.map((i) => `${Number(i.quantity)}× ${i.productName}`).join(', ')}
      </Text>
      <View style={styles.row}>
        <View style={styles.tags}>
          <View style={styles.tag}>
            <Text size="xs" weight="semibold" color="secondary">
              {FULFILLMENT_LABEL[order.fulfillment]}
            </Text>
          </View>
          {order.tableLabel ? (
            <View style={[styles.tag, styles.tagBlue]}>
              <Text size="xs" weight="semibold" style={{ color: colors.primary[700] }}>
                Meja {order.tableLabel}
              </Text>
            </View>
          ) : null}
        </View>
        <Text weight="bold">{rupiah(order.subtotal)}</Text>
      </View>
      {ACTIVE.includes(order.status) ? (
        <View style={styles.actions}>
          {next && canProcess ? (
            <Button size="sm" variant={isNew ? 'solid' : 'outline'} loading={busy} onPress={() => onAdvance(next.status)} style={styles.flex}>
              {next.label}
            </Button>
          ) : null}
          <Button size="sm" variant={order.status === 'READY' ? 'solid' : 'outline'} loading={paying} onPress={onPay} style={styles.flex}>
            Bayar di Kasir
          </Button>
        </View>
      ) : null}
    </Card>
  );
}

function OrderDetail({ order, canProcess, busy, paying, onAdvance, onPay, onCancel, onClose }: CardProps & { onCancel: () => void; onClose: () => void }) {
  const meta = STATUS_META[order.status];
  const next = nextAction(order.status);
  const wa = order.customerPhone?.replace(/\D/g, '').replace(/^0/, '62');
  return (
    <View style={styles.sheet}>
      <View style={styles.row}>
        <Text size="lg" weight="bold">
          {order.orderNumber}
        </Text>
        <Badge variant={meta.variant}>{meta.label}</Badge>
      </View>
      <ScrollView style={styles.sheetBody} contentContainerStyle={{ gap: spacing.md }}>
        <View style={styles.infoBox}>
          <Text weight="semibold">
            {order.customerName}
            {order.customerPhone ? <Text color="muted"> · {order.customerPhone}</Text> : null}
          </Text>
          <Text size="sm" color="secondary">
            {FULFILLMENT_LABEL[order.fulfillment]}
            {order.tableLabel ? ` · Meja ${order.tableLabel}` : ''} · {new Date(order.createdAt).toLocaleString('id-ID')}
          </Text>
          {order.deliveryAddress ? (
            <Text size="sm" color="secondary">
              {order.deliveryAddress}
            </Text>
          ) : null}
          {order.notes ? (
            <Text size="sm" color="secondary" style={styles.italic}>
              “{order.notes}”
            </Text>
          ) : null}
        </View>
        <View>
          {order.items.map((item) => (
            <View key={item.id} style={styles.itemRow}>
              <View style={styles.flex}>
                <Text size="sm" weight="semibold">
                  {Number(item.quantity)}× {item.productName}
                </Text>
                {item.notes ? (
                  <Text size="xs" color="warning">
                    “{item.notes}”
                  </Text>
                ) : null}
              </View>
              <Text size="sm" weight="semibold">
                {rupiah(item.subtotal)}
              </Text>
            </View>
          ))}
          <View style={[styles.row, styles.totalRow]}>
            <Text color="secondary">Total</Text>
            <Text size="xl" weight="bold">
              {rupiah(order.subtotal)}
            </Text>
          </View>
        </View>
      </ScrollView>
      {ACTIVE.includes(order.status) ? (
        <View style={{ gap: spacing.sm }}>
          <View style={styles.actions}>
            {next && canProcess ? (
              <Button loading={busy} onPress={() => onAdvance(next.status)} style={styles.flex}>
                {next.label}
              </Button>
            ) : null}
            <Button variant={next && canProcess ? 'outline' : 'solid'} loading={paying} onPress={onPay} style={styles.flex}>
              Bayar di Kasir
            </Button>
          </View>
          <View style={styles.actions}>
            {wa ? (
              <Button variant="ghost" onPress={() => Linking.openURL(`https://wa.me/${wa}`)} style={styles.flex}>
                WhatsApp
              </Button>
            ) : null}
            {canProcess ? (
              <Button variant="dangerOutline" onPress={onCancel} style={styles.flex}>
                Batalkan
              </Button>
            ) : null}
          </View>
        </View>
      ) : (
        <Button variant="outline" onPress={onClose}>
          Tutup
        </Button>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  filters: { paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl, gap: spacing.sm },
  card: { gap: spacing.sm },
  cardNew: { borderWidth: 1.5, borderColor: colors.error[200] },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  flex: { flex: 1 },
  items: { lineHeight: 20 },
  tags: { flexDirection: 'row', gap: spacing.xs, flexShrink: 1 },
  tag: { backgroundColor: colors.gray[100], borderRadius: radii.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  tagBlue: { backgroundColor: colors.primary[50] },
  actions: { flexDirection: 'row', gap: spacing.sm },
  empty: { marginTop: spacing['3xl'] },
  sheet: { gap: spacing.md, maxHeight: 640 },
  sheetBody: { flexGrow: 0 },
  infoBox: { backgroundColor: colors.surface, borderRadius: radii.lg, padding: spacing.md, gap: 4 },
  italic: { fontStyle: 'italic' },
  itemRow: { flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
  totalRow: { marginTop: spacing.sm },
});
