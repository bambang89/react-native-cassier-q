import { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { fetchOrders } from '../../api/ordersApi';
import type { MainTabParamList, RootStackParamList } from '../../navigation/types';
import type { Order, OrderStatus } from '../../types/models';
import { colors, spacing } from '../../theme';
import { Badge } from '../../components/ui/dataDisplay';
import { Card, Header } from '../../components/ui/recipes';
import { Text } from '../../components/ui/typography';

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

export default function OrdersScreen({ navigation }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (nextPage = 0) => {
    setLoading(true);
    try {
      const result = await fetchOrders({ page: nextPage });
      setOrders((prev) => (nextPage === 0 ? result.content : [...prev, ...result.content]));
      setPage(result.page);
      setTotalPages(result.totalPages);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(0);
  }, [load]);

  return (
    <View style={styles.container}>
      <Header title="Riwayat Transaksi" />
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        onRefresh={() => load(0)}
        refreshing={loading && page === 0}
        onEndReached={() => {
          if (!loading && page + 1 < totalPages) load(page + 1);
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
          <Text color="muted" align="center" style={styles.empty}>
            {loading ? 'Memuat transaksi...' : 'Belum ada transaksi'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  empty: { marginTop: spacing['3xl'] },
});
