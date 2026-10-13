import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import * as inventoryApi from '@/api/inventoryApi';
import type { StockMovementItem } from '@/types/models';
import { colors } from '@/theme';
import { EmptyState } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { HistoryIcon } from '@/components/icons/LineIcons';

import { dateTime, MOVEMENT_TYPES, qty } from '../inventoryLabels';
import { FilterChips, styles } from './shared';

const TYPES = [
  { value: '', label: 'Semua' },
  { value: 'SALE', label: 'Penjualan' },
  { value: 'STOCK_IN', label: 'Restock' },
  { value: 'PURCHASE', label: 'Terima PO' },
  { value: 'STOCK_OPNAME', label: 'Opname' },
  { value: 'BAD_STOCK', label: 'Bad stock' },
  { value: 'VOID_TRANSACTION', label: 'Void' },
];

/** All stock movements, newest first, with in/out amount and stock before → after. */
export function MovementsTab() {
  const [type, setType] = useState('');
  const [items, setItems] = useState<StockMovementItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  /** Loads a page of movements (page 0 replaces the list). */
  const load = useCallback(
    async (nextPage = 0) => {
      setLoading(true);
      try {
        const result = await inventoryApi.fetchMovements({ type: type || undefined, page: nextPage, size: 30 });
        setItems((prev) => (nextPage === 0 ? result.content : [...prev, ...result.content]));
        setPage(result.page);
        setTotalPages(result.totalPages);
      } finally {
        setLoading(false);
      }
    },
    [type],
  );

  useFocusEffect(useCallback(() => void load(0), [load]));

  return (
    <View style={styles.flex}>
      <FilterChips value={type} onChange={setType} options={TYPES} />
      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        refreshing={loading && page === 0}
        onRefresh={() => load(0)}
        onEndReached={() => {
          if (!loading && page + 1 < totalPages) load(page + 1);
        }}
        onEndReachedThreshold={0.4}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState icon={HistoryIcon} title="Belum ada mutasi" description="Keluar-masuk stok akan tercatat di sini." />
          )
        }
        renderItem={({ item }) => {
          const delta = item.stockAfter - item.stockBefore;
          const meta = MOVEMENT_TYPES[item.movementType] ?? { label: item.movementType, sign: delta >= 0 ? 1 : -1 };
          const incoming = delta >= 0;
          return (
            <View style={[styles.card, styles.row]}>
              <View
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: incoming ? colors.success[50] : colors.error[50],
                }}
              >
                <Text weight="bold" style={{ color: incoming ? colors.success[700] : colors.error[600] }}>
                  {incoming ? '+' : '−'}
                </Text>
              </View>
              <View style={styles.flex}>
                <Text weight="semibold" numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text size="xs" color="secondary" numberOfLines={1}>
                  {meta.label} · {dateTime(item.createdAt)}
                  {item.createdBy ? ` · ${item.createdBy}` : ''}
                </Text>
                {item.notes ? (
                  <Text size="xs" color="muted" numberOfLines={1}>
                    {item.notes}
                  </Text>
                ) : null}
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text weight="bold" style={{ color: incoming ? colors.success[700] : colors.error[600] }}>
                  {incoming ? '+' : '−'}
                  {qty(Math.abs(delta))}
                </Text>
                <Text size="xs" color="muted">
                  {qty(item.stockBefore)} → {qty(item.stockAfter)}
                </Text>
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}
