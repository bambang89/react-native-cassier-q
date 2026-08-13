import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { fetchOrders } from '../../api/ordersApi';
import type { Order } from '../../types/models';

const STATUS_LABEL: Record<Order['status'], string> = {
  paid: 'Lunas',
  cancelled: 'Dibatalkan',
  refunded: 'Refund',
};

export default function OrdersScreen() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await fetchOrders());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Riwayat Transaksi</Text>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        onRefresh={load}
        refreshing={loading}
        renderItem={({ item }) => (
          <View style={styles.row}>
            <View>
              <Text style={styles.date}>{new Date(item.createdAt).toLocaleString('id-ID')}</Text>
              <Text style={styles.status}>{STATUS_LABEL[item.status]}</Text>
            </View>
            <Text style={styles.total}>Rp {item.total.toLocaleString('id-ID')}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>Belum ada transaksi</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  date: { fontWeight: '600' },
  status: { color: '#999', fontSize: 12 },
  total: { fontWeight: '700' },
  empty: { textAlign: 'center', marginTop: 40, color: '#999' },
});
