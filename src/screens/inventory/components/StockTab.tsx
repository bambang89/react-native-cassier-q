import { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import * as inventoryApi from '@/api/inventoryApi';
import type { StockItem, StockStatus, StockSummary } from '@/types/models';
import { apiErrorMessage } from '@/api/errors';
import { usePermissions } from '@/hooks/usePermissions';
import { colors } from '@/theme';
import { Badge } from '@/components/ui/dataDisplay';
import { Button, FormControl, Input, Pressable } from '@/components/ui/forms';
import { Modal } from '@/components/ui/overlay';
import { EmptyState } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { AlertTriangleIcon, BoxIcon, LayersIcon, SearchIcon, TrendDownIcon, WalletIcon } from '@/components/icons/LineIcons';

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
  const [minimumTarget, setMinimumTarget] = useState<StockItem | null>(null);
  // Minimum stok ikut izin restock (Hak Akses Menu → Inventori).
  const canSetMinimum = usePermissions().can('inventory.restock');

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
    <>
    <FlatList
      data={items}
      keyExtractor={(item) => item.productId}
      refreshing={loading}
      onRefresh={load}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={{ gap: 10 }}>
          {/* Ketuk kartu Habis/Menipis untuk langsung memfilter daftar. */}
          <View style={styles.row}>
            <StatTile label="Produk" value={String(data?.products ?? 0)} icon={BoxIcon} onPress={() => setFilter('ALL')} active={filter === 'ALL'} />
            <StatTile label="Habis" value={String(data?.outOfStock ?? 0)} tone="error" icon={AlertTriangleIcon} onPress={() => setFilter(filter === 'OUT' ? 'ALL' : 'OUT')} active={filter === 'OUT'} />
            <StatTile label="Menipis" value={String(data?.lowStock ?? 0)} tone="warning" icon={TrendDownIcon} onPress={() => setFilter(filter === 'LOW' ? 'ALL' : 'LOW')} active={filter === 'LOW'} />
          </View>
          <StatTile label="Nilai stok (harga modal)" value={rupiah(data?.totalValue ?? 0)} tone="success" icon={WalletIcon} large />
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
        const minimum = item.minimumStock && item.minimumStock > 0 ? item.minimumStock : null;
        return (
          <Pressable
            disabled={!canSetMinimum}
            onPress={() => setMinimumTarget(item)}
            style={[styles.card, styles.row]}
            accessibilityLabel={`Atur minimum stok ${item.productName}`}
          >
            <View style={styles.flex}>
              <Text weight="semibold" numberOfLines={1}>
                {item.productName}
              </Text>
              <Text size="xs" color="muted" numberOfLines={1}>
                {item.sku} · {item.categoryName}
                {item.stockValue !== null ? ` · ${rupiah(item.stockValue)}` : ''}
              </Text>
              <Text size="xs" weight="semibold" style={{ color: minimum ? colors.primary[600] : colors.gray[400] }}>
                {minimum ? `Minimum ${qty(minimum)} ${item.baseUnitName}` : 'Minimum belum diatur'}
                {canSetMinimum ? ' · ubah' : ''}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text weight="bold">
                {qty(item.stock)} {item.baseUnitName}
              </Text>
              <Badge variant={badge.variant}>{badge.label}</Badge>
            </View>
          </Pressable>
        );
      }}
    />
    <Modal isOpen={!!minimumTarget} onClose={() => setMinimumTarget(null)}>
      {minimumTarget ? (
        <MinimumStockForm
          item={minimumTarget}
          onDone={(updated) => {
            setMinimumTarget(null);
            // Ganti baris yang diubah lalu muat ulang ringkasan (status & jumlah menipis).
            setData((prev) => (prev ? { ...prev, items: prev.items.map((i) => (i.productId === updated.productId ? updated : i)) } : prev));
            load();
          }}
          onCancel={() => setMinimumTarget(null)}
        />
      ) : null}
    </Modal>
    </>
  );
}

/** Minimum stok per produk: di/bawah angka ini produk ditandai "Menipis" di semua layar. */
function MinimumStockForm({
  item,
  onDone,
  onCancel,
}: {
  item: StockItem;
  onDone: (updated: StockItem) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(item.minimumStock && item.minimumStock > 0 ? String(item.minimumStock) : '');
  const [saving, setSaving] = useState(false);

  const save = async (minimum: number) => {
    setSaving(true);
    try {
      onDone(await inventoryApi.updateMinimumStock(item.productId, minimum));
    } catch (error) {
      Alert.alert('Gagal', apiErrorMessage(error, 'Minimum stok tidak bisa disimpan.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View>
      <Text weight="bold" size="lg">
        Minimum Stok
      </Text>
      <Text size="sm" color="secondary" style={{ marginTop: 4, marginBottom: 16 }}>
        {item.productName} ditandai "Menipis" bila stoknya {value ? `≤ ${value}` : 'di bawah minimum'} {item.baseUnitName}.
        Stok sekarang {qty(item.stock)} {item.baseUnitName}.
      </Text>
      <FormControl label={`Minimum (${item.baseUnitName})`} helperText="Kosongkan untuk memakai ambang default toko (5).">
        <Input
          value={value}
          onChangeText={(v) => setValue(v.replace(/[^0-9.]/g, ''))}
          keyboardType="decimal-pad"
          placeholder="mis. 20"
          autoFocus
        />
      </FormControl>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 8 }}>
        <Button variant="ghost" onPress={onCancel} disabled={saving}>
          Batal
        </Button>
        <Button onPress={() => save(Number(value || 0))} loading={saving}>
          Simpan
        </Button>
      </View>
    </View>
  );
}
