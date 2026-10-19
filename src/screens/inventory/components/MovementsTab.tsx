import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { ScrollView, SectionList, StyleSheet, TextInput, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';

import * as inventoryApi from '@/api/inventoryApi';
import type { StockItem, StockMovementItem } from '@/types/models';
import { colors, radii, spacing } from '@/theme';
import { EmptyState } from '@/components/ui/recipes';
import { Pressable } from '@/components/ui/forms';
import { Modal } from '@/components/ui/overlay';
import { Text } from '@/components/ui/typography';
import {
  AlertTriangleIcon,
  BoxIcon,
  CartIcon,
  ClipboardIcon,
  HistoryIcon,
  ReceiveIcon,
  RefundIcon,
  CalendarIcon,
  ChevronDownIcon,
  CloseIcon,
  SearchIcon,
} from '@/components/icons/LineIcons';
import type { LineIconProps } from '@/components/icons/LineIcons';

import { MOVEMENT_TYPES, qty } from '../inventoryLabels';
import { FilterChips } from './shared';

const TYPES = [
  { value: '', label: 'Semua' },
  { value: 'SALE', label: 'Penjualan' },
  { value: 'STOCK_IN', label: 'Restock' },
  { value: 'PURCHASE', label: 'Terima PO' },
  { value: 'STOCK_OPNAME', label: 'Opname' },
  { value: 'BAD_STOCK', label: 'Bad stock' },
  { value: 'VOID_TRANSACTION', label: 'Void' },
];

/** Icon and tint per movement type. */
const TYPE_ICONS: Record<string, { icon: ComponentType<LineIconProps>; fg: string; bg: string }> = {
  SALE: { icon: CartIcon, fg: colors.primary[600], bg: colors.primary[50] },
  STOCK_IN: { icon: ReceiveIcon, fg: colors.success[600], bg: colors.success[50] },
  PURCHASE: { icon: BoxIcon, fg: colors.teal[700], bg: colors.teal[50] },
  STOCK_OPNAME: { icon: ClipboardIcon, fg: colors.warning[600], bg: colors.warning[50] },
  BAD_STOCK: { icon: AlertTriangleIcon, fg: colors.error[600], bg: colors.error[50] },
  BAD_STOCK_CANCEL: { icon: RefundIcon, fg: colors.gray[700], bg: colors.gray[100] },
  VOID_TRANSACTION: { icon: RefundIcon, fg: colors.gray[700], bg: colors.gray[100] },
};
const PERIODS = [
  { key: 'all', label: 'Semua waktu', days: null },
  { key: 'today', label: 'Hari ini', days: 0 },
  { key: '7d', label: '7 hari', days: 6 },
  { key: '30d', label: '30 hari', days: 29 },
] as const;
type PeriodKey = (typeof PERIODS)[number]['key'];

/** Start of the period (local midnight N days ago) as ISO, or undefined for all time. */
function periodFrom(key: PeriodKey): string | undefined {
  const days = PERIODS.find((p) => p.key === key)?.days;
  if (days === null || days === undefined) return undefined;
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - days);
  return start.toISOString();
}

const FALLBACK_ICON = { icon: HistoryIcon, fg: colors.gray[600], bg: colors.gray[100] };

/** "Hari ini", "Kemarin", or e.g. "Senin, 13 Okt". */
function dayLabel(iso: string): string {
  const date = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Hari ini';
  if (date.toDateString() === yesterday.toDateString()) return 'Kemarin';
  return date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
}

const timeOf = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }).replace(':', '.');

/** All stock movements, newest first, grouped per day, with in/out amount and stock before → after. */
export function MovementsTab() {
  const [type, setType] = useState('');
  const [period, setPeriod] = useState<PeriodKey>('all');
  const [product, setProduct] = useState<{ id: string; name: string } | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [items, setItems] = useState<StockMovementItem[]>([]);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  /** Loads a page of movements (page 0 replaces the list). */
  const load = useCallback(
    async (nextPage = 0) => {
      setLoading(true);
      try {
        const result = await inventoryApi.fetchMovements({
          type: type || undefined,
          productId: product?.id,
          from: periodFrom(period),
          page: nextPage,
          size: 30,
        });
        setItems((prev) => (nextPage === 0 ? result.content : [...prev, ...result.content]));
        setPage(result.page);
        setTotalPages(result.totalPages);
      } finally {
        setLoading(false);
      }
    },
    [type, product, period],
  );

  useFocusEffect(useCallback(() => void load(0), [load]));

  const sections = useMemo(() => {
    const byDay = new Map<string, StockMovementItem[]>();
    for (const item of items) {
      const key = dayLabel(item.createdAt);
      byDay.set(key, [...(byDay.get(key) ?? []), item]);
    }
    return [...byDay.entries()].map(([title, data]) => ({ title, data }));
  }, [items]);

  return (
    <View style={local.flex}>
      <FilterChips value={type} onChange={setType} options={TYPES} />
      <View style={local.filterBar}>
        <Pressable onPress={() => setPickerOpen(true)} style={[local.filterButton, local.productButton, product && local.filterButtonOn]}>
          <BoxIcon size={14} color={product ? colors.primary[600] : colors.gray[500]} />
          <Text size="xs" weight="semibold" numberOfLines={1} style={[local.filterText, product && local.filterTextOn]}>
            {product ? product.name : 'Semua produk'}
          </Text>
          {product ? (
            <Pressable onPress={() => setProduct(null)} hitSlop={8} accessibilityLabel="Hapus filter produk">
              <CloseIcon size={13} color={colors.primary[600]} />
            </Pressable>
          ) : (
            <ChevronDownIcon size={13} color={colors.gray[500]} />
          )}
        </Pressable>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={local.periodScroll} contentContainerStyle={local.periodRow}>
          {PERIODS.map((p) => {
            const active = p.key === period;
            return (
              <Pressable key={p.key} onPress={() => setPeriod(p.key)} style={[local.filterButton, active && local.filterButtonOn]}>
                {p.key === 'all' ? <CalendarIcon size={13} color={active ? colors.primary[600] : colors.gray[500]} /> : null}
                <Text size="xs" weight="semibold" style={[local.filterText, active && local.filterTextOn]}>
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        stickySectionHeadersEnabled={false}
        refreshing={loading && page === 0}
        onRefresh={() => load(0)}
        onEndReached={() => {
          if (!loading && page + 1 < totalPages) load(page + 1);
        }}
        onEndReachedThreshold={0.4}
        contentContainerStyle={local.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState icon={HistoryIcon} title="Belum ada mutasi" description="Keluar-masuk stok akan tercatat di sini." />
          )
        }
        renderSectionHeader={({ section }) => (
          <View style={local.sectionHeader}>
            <Text size="xs" weight="bold" style={local.sectionTitle}>
              {section.title.toUpperCase()}
            </Text>
            <Text size="xs" color="muted">
              {section.data.length} mutasi
            </Text>
          </View>
        )}
        renderItem={({ item, index, section }) => {
          const delta = item.stockAfter - item.stockBefore;
          const incoming = delta >= 0;
          const meta = MOVEMENT_TYPES[item.movementType] ?? { label: item.movementType, sign: incoming ? 1 : -1 };
          const look = TYPE_ICONS[item.movementType] ?? FALLBACK_ICON;
          const Icon = look.icon;
          const first = index === 0;
          const last = index === section.data.length - 1;
          return (
            <Pressable
              onPress={() => setProduct({ id: item.productId, name: item.productName })}
              disabled={product?.id === item.productId}
              style={[local.row, first && local.rowFirst, last && local.rowLast, !last && local.rowDivider]}
            >
              <View style={[local.icon, { backgroundColor: look.bg }]}>
                <Icon size={18} color={look.fg} />
              </View>
              <View style={local.body}>
                <Text weight="semibold" numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text size="xs" color="secondary" numberOfLines={1}>
                  {meta.label} · {timeOf(item.createdAt)}
                  {item.createdBy ? ` · ${item.createdBy}` : ''}
                </Text>
                {item.notes ? (
                  <Text size="xs" color="muted" numberOfLines={1} style={local.notes}>
                    “{item.notes}”
                  </Text>
                ) : null}
              </View>
              <View style={local.right}>
                <View style={[local.deltaPill, incoming ? local.deltaIn : local.deltaOut]}>
                  <Text size="sm" weight="bold" style={{ color: incoming ? colors.success[700] : colors.error[600] }}>
                    {incoming ? '+' : '−'}
                    {qty(Math.abs(delta))}
                  </Text>
                </View>
                <Text size="xs" color="muted" style={local.stockLine}>
                  {qty(item.stockBefore)}
                  {'  →  '}
                  <Text size="xs" weight="semibold">
                    {qty(item.stockAfter)}
                  </Text>
                </Text>
              </View>
            </Pressable>
          );
        }}
      />
      <Modal isOpen={pickerOpen} onClose={() => setPickerOpen(false)}>
        <ProductPicker
          onPick={(picked) => {
            setProduct(picked);
            setPickerOpen(false);
          }}
        />
      </Modal>
    </View>
  );
}

/** Product picker for the movement filter (searchable stock list). */
function ProductPicker({ onPick }: { onPick: (product: { id: string; name: string }) => void }) {
  const [items, setItems] = useState<StockItem[] | null>(null);
  const [query, setQuery] = useState('');

  useEffect(() => {
    inventoryApi
      .fetchStock()
      .then((summary) => setItems(summary.items))
      .catch(() => setItems([]));
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (items ?? []).filter((i) => !q || i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)).slice(0, 50);
  }, [items, query]);

  return (
    <View>
      <Text weight="bold" size="lg" style={{ marginBottom: spacing.md }}>
        Mutasi produk
      </Text>
      <View style={local.search}>
        <SearchIcon size={16} color={colors.text.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Cari nama atau SKU"
          placeholderTextColor={colors.gray[400]}
          autoCorrect={false}
          style={local.searchInput}
        />
      </View>
      <ScrollView style={{ maxHeight: 380 }} keyboardShouldPersistTaps="handled">
        {items === null ? (
          <Text size="sm" color="muted" style={{ paddingVertical: spacing.md }}>
            Memuat produk...
          </Text>
        ) : (
          results.map((p) => (
            <Pressable key={p.productId} onPress={() => onPick({ id: p.productId, name: p.productName })} style={local.pickRow}>
              <View style={{ flex: 1 }}>
                <Text weight="semibold" numberOfLines={1}>
                  {p.productName}
                </Text>
                <Text size="xs" color="muted">
                  {p.sku} · stok {qty(p.stock)} {p.baseUnitName}
                </Text>
              </View>
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const local = StyleSheet.create({
  flex: { flex: 1 },
  filterBar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingLeft: spacing.base, paddingBottom: spacing.xs },
  productButton: { maxWidth: 170, flexShrink: 1 },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  filterButtonOn: { borderColor: colors.primary[200], backgroundColor: colors.primary[50] },
  filterText: { color: colors.text.secondary, flexShrink: 1 },
  filterTextOn: { color: colors.primary[700] },
  periodScroll: { flexGrow: 0, flexShrink: 1 },
  periodRow: { gap: spacing.sm, paddingRight: spacing.base },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.sm,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: 15, color: colors.text.primary },
  pickRow: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing['3xl'] },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.base,
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  sectionTitle: { letterSpacing: 0.8, color: colors.text.muted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  rowFirst: { borderTopWidth: 1, borderTopLeftRadius: radii.xl, borderTopRightRadius: radii.xl },
  rowLast: { borderBottomWidth: 1, borderBottomLeftRadius: radii.xl, borderBottomRightRadius: radii.xl },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.gray[100] },
  icon: { width: 40, height: 40, borderRadius: radii.lg, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 2 },
  notes: { fontStyle: 'italic' },
  right: { alignItems: 'flex-end', gap: 4 },
  deltaPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 9999 },
  deltaIn: { backgroundColor: colors.success[50] },
  deltaOut: { backgroundColor: colors.error[50] },
  stockLine: { fontVariant: ['tabular-nums'] },
});
