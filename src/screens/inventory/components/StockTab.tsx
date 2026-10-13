import { useCallback, useMemo, useState } from 'react';
import { FlatList, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import * as inventoryApi from '@/api/inventoryApi';
import type { StockStatus, StockSummary } from '@/types/models';
import { colors } from '@/theme';
import { Badge } from '@/components/ui/dataDisplay';
import { EmptyState } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { LayersIcon, SearchIcon } from '@/components/icons/LineIcons';

import { qty, rupiah } from '../inventoryLabels';
import { FilterChips, StatTile, styles } from './shared';

type Filter = 'ALL' | StockStatus;

const STATUS_BADGE: Record<StockStatus, { label: string; variant: 'error' | 'warning' | 'success' }> = {
  OUT: { label: 'Habis', variant: 'error' },
  LOW: { label: 'Menipis', variant: 'warning' },
  OK: { label: 'Aman', variant: 'success' },
};

/** Stock of every product: summary tiles, status filter and search. */
export function StockTab() {
  const [data, setData] = useState<StockSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [query, setQuery] = useState('');

  /** Loads the stock list. */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setData(await inventoryApi.fetchStock());
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void load(), [load]));

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data?.items ?? []).filter(
      (i) =>
        (filter === 'ALL' || i.status === filter) &&
        (!q || i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)),
    );
  }, [data, filter, query]);

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.productId}
      refreshing={loading}
      onRefresh={load}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={{ gap: 10 }}>
          <View style={styles.row}>
            <StatTile label="Produk" value={String(data?.products ?? 0)} />
            <StatTile label="Habis" value={String(data?.outOfStock ?? 0)} tone="error" />
            <StatTile label="Menipis" value={String(data?.lowStock ?? 0)} tone="warning" />
          </View>
          <StatTile label="Nilai stok (harga modal)" value={rupiah(data?.totalValue ?? 0)} tone="success" />
          <View style={[styles.searchBox, { marginHorizontal: 0 }]}>
            <SearchIcon size={16} color={colors.text.muted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Cari nama atau SKU"
              placeholderTextColor={colors.gray[400]}
              autoCorrect={false}
              style={styles.searchInput}
            />
          </View>
          <View style={{ marginHorizontal: -16 }}>
            <FilterChips<Filter>
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'ALL', label: 'Semua', count: data?.products },
                { value: 'OUT', label: 'Habis', count: data?.outOfStock },
                { value: 'LOW', label: 'Menipis', count: data?.lowStock },
                { value: 'OK', label: 'Aman' },
              ]}
            />
          </View>
        </View>
      }
      ListEmptyComponent={
        loading ? null : <EmptyState icon={LayersIcon} title="Tidak ada produk" description="Belum ada produk dengan status ini." />
      }
      renderItem={({ item }) => {
        const badge = STATUS_BADGE[item.status];
        return (
          <View style={[styles.card, styles.row]}>
            <View style={styles.flex}>
              <Text weight="semibold" numberOfLines={1}>
                {item.productName}
              </Text>
              <Text size="xs" color="muted" numberOfLines={1}>
                {item.sku} · {item.categoryName}
                {item.stockValue !== null ? ` · ${rupiah(item.stockValue)}` : ''}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text weight="bold">
                {qty(item.stock)} {item.baseUnitName}
              </Text>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </View>
          </View>
        );
      }}
    />
  );
}
