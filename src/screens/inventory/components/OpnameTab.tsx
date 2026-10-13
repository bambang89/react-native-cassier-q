import { useCallback, useState } from 'react';
import { FlatList, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import * as inventoryApi from '@/api/inventoryApi';
import { usePermissions } from '@/hooks/usePermissions';
import type { RootStackParamList } from '@/navigation/types';
import type { StockMovementItem } from '@/types/models';
import { colors } from '@/theme';
import { Button } from '@/components/ui/forms';
import { Text } from '@/components/ui/typography';
import { ClipboardIcon } from '@/components/icons/LineIcons';

import { dateTime, qty } from '../inventoryLabels';
import { styles } from './shared';

/** Start a stock count, and see recent opname adjustments. */
export function OpnameTab() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { can } = usePermissions();
  const [recent, setRecent] = useState<StockMovementItem[]>([]);
  const [loading, setLoading] = useState(true);

  /** Loads the latest opname adjustments. */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setRecent((await inventoryApi.fetchMovements({ type: 'STOCK_OPNAME', size: 30 })).content);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => void load(), [load]));

  return (
    <FlatList
      data={recent}
      keyExtractor={(item) => item.id}
      refreshing={loading}
      onRefresh={load}
      contentContainerStyle={styles.list}
      ListHeaderComponent={
        <View style={[styles.card, { gap: 10, marginBottom: 6 }]}>
          <View style={styles.row}>
            <View
              style={{ width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary[50] }}
            >
              <ClipboardIcon size={20} color={colors.primary[600]} />
            </View>
            <View style={styles.flex}>
              <Text weight="bold">Stok Opname</Text>
              <Text size="xs" color="muted">
                Hitung stok fisik di rak/gudang, lalu sistem menyesuaikan selisihnya otomatis dan mencatatnya di
                riwayat mutasi.
              </Text>
            </View>
          </View>
          {can('inventory.opname') ? (
            <Button onPress={() => navigation.navigate('StockOpname')}>Mulai Stok Opname</Button>
          ) : (
            <Text size="xs" color="muted">
              Anda tidak punya izin melakukan stok opname.
            </Text>
          )}
          <Text size="xs" weight="semibold" color="muted" style={{ letterSpacing: 0.6, marginTop: 4 }}>
            PENYESUAIAN TERAKHIR
          </Text>
        </View>
      }
      ListEmptyComponent={
        loading ? null : (
          <Text size="sm" color="muted" align="center" style={{ marginTop: 16 }}>
            Belum pernah ada stok opname.
          </Text>
        )
      }
      renderItem={({ item }) => {
        const delta = item.stockAfter - item.stockBefore;
        return (
          <View style={[styles.card, styles.row]}>
            <View style={styles.flex}>
              <Text weight="semibold" numberOfLines={1}>
                {item.productName}
              </Text>
              <Text size="xs" color="muted" numberOfLines={1}>
                {dateTime(item.createdAt)}
                {item.createdBy ? ` · ${item.createdBy}` : ''}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text weight="bold" style={{ color: delta >= 0 ? colors.success[700] : colors.error[600] }}>
                {delta >= 0 ? '+' : '−'}
                {qty(Math.abs(delta))} {item.unitName}
              </Text>
              <Text size="xs" color="muted">
                Sistem {qty(item.stockBefore)} → fisik {qty(item.stockAfter)}
              </Text>
            </View>
          </View>
        );
      }}
    />
  );
}
