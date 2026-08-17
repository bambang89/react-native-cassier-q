import { useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchPurchaseOrders } from '@/store/slices/purchaseOrdersSlice';
import { poStatusMeta } from '@/utils/purchaseOrders';
import type { RootStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { Button } from '@/components/ui/forms';
import { Badge } from '@/components/ui/dataDisplay';
import { AppBar, Card, EmptyState, StatCard } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'PurchaseOrders'>;

export default function PurchaseOrdersScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { items, page, totalPages, totalElements, status } = useAppSelector((state) => state.purchaseOrders);

  useEffect(() => {
    dispatch(fetchPurchaseOrders({ page: 0 }));
  }, [dispatch]);

  return (
    <View style={styles.container}>
      <AppBar
        title="Purchase Order"
        onBack={navigation.goBack}
        rightElement={
          <Button size="sm" onPress={() => navigation.navigate('PurchaseOrderForm')}>
            + Buat PO
          </Button>
        }
      />

      {totalElements > 0 ? (
        <View style={styles.statsRow}>
          <StatCard icon="📦" iconBg={colors.primary[100]} label="Total PO" value={totalElements.toLocaleString('id-ID')} />
        </View>
      ) : null}

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        onRefresh={() => dispatch(fetchPurchaseOrders({ page: 0 }))}
        refreshing={status === 'loading' && page === 0}
        onEndReached={() => {
          if (status !== 'loading' && page + 1 < totalPages) dispatch(fetchPurchaseOrders({ page: page + 1 }));
        }}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const meta = poStatusMeta(item);
          return (
            <Card
              shadow="none"
              style={styles.card}
              onPress={() => navigation.navigate('PurchaseOrderDetail', { purchaseOrderId: item.id })}
            >
              <View style={styles.row}>
                <View style={styles.info}>
                  <Text weight="semibold">{item.poNumber}</Text>
                  <Text size="xs" color="secondary">
                    {item.supplierName} · {new Date(item.orderDate).toLocaleDateString('id-ID')}
                  </Text>
                </View>
                <View style={styles.right}>
                  <Text weight="bold">Rp {item.totalCost.toLocaleString('id-ID')}</Text>
                  <Badge variant={meta.variant}>{meta.label}</Badge>
                </View>
              </View>
            </Card>
          );
        }}
        ListEmptyComponent={
          status === 'loading' ? (
            <Text color="muted" align="center" style={styles.empty}>
              Memuat purchase order...
            </Text>
          ) : (
            <EmptyState
              icon="📦"
              title="Belum Ada Purchase Order"
              description="Buat PO ke pemasok untuk mencatat pembelian barang dagangan secara rapi, lengkap dengan status penerimaannya."
              actionLabel="+ Buat PO"
              onAction={() => navigation.navigate('PurchaseOrderForm')}
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  statsRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing.xl },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  empty: { marginTop: spacing['3xl'] },
});
