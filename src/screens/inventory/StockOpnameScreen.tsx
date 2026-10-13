import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import * as inventoryApi from '@/api/inventoryApi';
import { apiErrorMessage } from '@/api/errors';
import type { RootStackParamList } from '@/navigation/types';
import type { StockItem } from '@/types/models';
import { colors, radii, spacing } from '@/theme';
import { Button } from '@/components/ui/forms';
import { AppBar } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { SearchIcon } from '@/components/icons/LineIcons';

import { qty, rupiah } from './inventoryLabels';

type Props = NativeStackScreenProps<RootStackParamList, 'StockOpname'>;

/**
 * Stock count: type the physical quantity of the products counted; only changed rows are
 * sent. The API sets stock to the counted quantity and records each difference.
 */
export default function StockOpnameScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [items, setItems] = useState<StockItem[]>([]);
  const [counts, setCounts] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    inventoryApi
      .fetchStock()
      .then((summary) => setItems(summary.items))
      .catch((error) => Alert.alert('Gagal', apiErrorMessage(error, 'Daftar stok gagal dimuat.')));
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => !q || i.productName.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q));
  }, [items, query]);

  // Only rows whose counted quantity differs from the system stock.
  const changes = useMemo(
    () =>
      items
        .filter((i) => counts[i.productId] !== undefined && counts[i.productId] !== '')
        .map((i) => ({ item: i, counted: Number(counts[i.productId]) }))
        .filter(({ item, counted }) => !Number.isNaN(counted) && counted !== item.stock),
    [items, counts],
  );
  const valueDiff = changes.reduce((sum, { item, counted }) => sum + (counted - item.stock) * (item.costPrice ?? 0), 0);

  /** Sends the counted quantities after confirmation. */
  const submit = () => {
    Alert.alert(
      'Simpan stok opname?',
      `${changes.length} produk akan disesuaikan dengan jumlah fisik (selisih nilai ${rupiah(valueDiff)}).`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Simpan',
          onPress: async () => {
            setSaving(true);
            try {
              const result = await inventoryApi.submitOpname(
                changes.map(({ item, counted }) => ({ productId: item.productId, countedQuantity: counted })),
                notes.trim() || undefined,
              );
              Alert.alert('Stok opname tersimpan', `${result.lines.length} produk disesuaikan.`);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Gagal', apiErrorMessage(error, 'Stok opname tidak bisa disimpan.'));
            } finally {
              setSaving(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <AppBar title="Stok Opname" onBack={navigation.goBack} />
      <View style={styles.searchBox}>
        <SearchIcon size={16} color={colors.text.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Cari produk yang dihitung"
          placeholderTextColor={colors.gray[400]}
          autoCorrect={false}
          style={styles.searchInput}
        />
      </View>
      <FlatList
        data={visible}
        keyExtractor={(item) => item.productId}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const typed = counts[item.productId];
          const diff = typed !== undefined && typed !== '' ? Number(typed) - item.stock : 0;
          return (
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text weight="semibold" numberOfLines={1}>
                  {item.productName}
                </Text>
                <Text size="xs" color="muted">
                  Sistem: {qty(item.stock)} {item.baseUnitName}
                  {diff !== 0 ? (
                    <Text size="xs" weight="bold" style={{ color: diff > 0 ? colors.success[700] : colors.error[600] }}>
                      {`  ${diff > 0 ? '+' : '−'}${qty(Math.abs(diff))}`}
                    </Text>
                  ) : null}
                </Text>
              </View>
              <TextInput
                value={typed ?? ''}
                onChangeText={(v) => setCounts((prev) => ({ ...prev, [item.productId]: v.replace(/[^0-9.]/g, '') }))}
                placeholder={qty(item.stock)}
                placeholderTextColor={colors.gray[300]}
                keyboardType="decimal-pad"
                style={[styles.countInput, diff !== 0 && styles.countInputChanged]}
                accessibilityLabel={`Jumlah fisik ${item.productName}`}
              />
            </View>
          );
        }}
      />
      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.sm }]}>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Catatan opname (opsional)"
          placeholderTextColor={colors.gray[400]}
          style={styles.notes}
          maxLength={500}
        />
        <Button fullWidth onPress={submit} loading={saving} disabled={changes.length === 0 || saving}>
          {changes.length ? `Simpan ${changes.length} Penyesuaian` : 'Isi jumlah fisik yang berbeda'}
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.base,
    marginBottom: 0,
    paddingHorizontal: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  searchInput: { flex: 1, paddingVertical: spacing.sm, fontSize: 15, color: colors.text.primary },
  list: { padding: spacing.base, gap: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  countInput: {
    width: 80,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
  },
  countInputChanged: { borderColor: colors.primary[600], backgroundColor: colors.primary[50] },
  footer: {
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  notes: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
    color: colors.text.primary,
  },
});
