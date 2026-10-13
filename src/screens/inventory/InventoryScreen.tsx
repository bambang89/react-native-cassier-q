import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radii, spacing } from '@/theme';
import { Pressable } from '@/components/ui/forms';
import { Header } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';

import { BadStockTab } from './components/BadStockTab';
import { MovementsTab } from './components/MovementsTab';
import { OpnameTab } from './components/OpnameTab';
import { StockTab } from './components/StockTab';

type TabKey = 'stock' | 'movements' | 'opname' | 'badStock';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'stock', label: 'Stok' },
  { key: 'movements', label: 'Mutasi' },
  { key: 'opname', label: 'Opname' },
  { key: 'badStock', label: 'Bad Stock' },
];

/** Inventori menu: stock list, stock movements, stock opname and bad stock. */
export default function InventoryScreen() {
  const [tab, setTab] = useState<TabKey>('stock');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header title="Inventori" subtitle="Stok, mutasi, opname & bad stock" />
      <View style={styles.segment}>
        {TABS.map((t) => {
          const active = t.key === tab;
          return (
            <Pressable key={t.key} onPress={() => setTab(t.key)} style={[styles.segmentItem, active && styles.segmentItemActive]}>
              <Text size="sm" weight="semibold" style={active ? styles.segmentTextActive : styles.segmentText}>
                {t.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.flex}>
        {tab === 'stock' ? <StockTab /> : null}
        {tab === 'movements' ? <MovementsTab /> : null}
        {tab === 'opname' ? <OpnameTab /> : null}
        {tab === 'badStock' ? <BadStockTab /> : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  segment: {
    flexDirection: 'row',
    margin: spacing.base,
    marginBottom: spacing.xs,
    padding: 4,
    borderRadius: radii.lg,
    backgroundColor: colors.gray[100],
  },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radii.md },
  segmentItemActive: { backgroundColor: colors.background },
  segmentText: { color: colors.text.secondary },
  segmentTextActive: { color: colors.primary[700] },
});
