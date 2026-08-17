import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSalesSummary } from '@/store/slices/reportsSlice';
import { colors, spacing } from '@/theme';
import { Button } from '@/components/ui/forms';
import { Divider } from '@/components/ui/dataDisplay';
import { Card, Header, StatCard } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';

type RangeOption = 7 | 30;

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function rangeParams(days: RangeOption) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - (days - 1));
  return { from: isoDate(from), to: isoDate(to) };
}

export default function ReportsScreen() {
  const dispatch = useAppDispatch();
  const [range, setRange] = useState<RangeOption>(7);
  const summary = useAppSelector((state) => state.reports.summary);
  const status = useAppSelector((state) => state.reports.status);
  const loading = status === 'loading';

  const load = (days: RangeOption) => {
    dispatch(fetchSalesSummary(rangeParams(days)));
  };

  useEffect(() => {
    load(range);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  return (
    <View style={styles.container}>
      <Header title="Laporan Penjualan" />

      <View style={styles.rangeRow}>
        <Button
          size="sm"
          variant={range === 7 ? 'solid' : 'outline'}
          onPress={() => setRange(7)}
          style={styles.rangeButton}
        >
          7 Hari
        </Button>
        <Button
          size="sm"
          variant={range === 30 ? 'solid' : 'outline'}
          onPress={() => setRange(30)}
          style={styles.rangeButton}
        >
          30 Hari
        </Button>
      </View>

      {!summary ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.body}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(range)} />}
        >
          <View style={styles.statsRow}>
            <StatCard
              icon="💰"
              iconBg={colors.success[100]}
              label="Total Penjualan"
              value={`Rp ${summary.grossSales.toLocaleString('id-ID')}`}
            />
            <StatCard
              icon="🧾"
              iconBg={colors.info[100]}
              label="Jumlah Transaksi"
              value={String(summary.orderCount)}
            />
          </View>

          <Text size="sm" color="muted" style={styles.period}>
            📅 Periode: {summary.from} — {summary.to}
          </Text>

          <Text weight="bold" size="lg" style={styles.sectionTitle}>
            🏆 Produk Terlaris
          </Text>
          <Card padding="none" shadow="sm">
            {summary.topSellers.length === 0 ? (
              <View style={styles.emptyBest}>
                <Text style={styles.emptyBestIcon}>📊</Text>
                <Text color="secondary" align="center">
                  Belum ada penjualan di periode ini. Data akan muncul begitu ada transaksi baru.
                </Text>
              </View>
            ) : (
              summary.topSellers.map((seller, index) => (
                <View key={seller.productId}>
                  {index > 0 ? <Divider /> : null}
                  <View style={styles.bestRow}>
                    <Text style={styles.bestRank}>{index + 1}</Text>
                    <View style={styles.bestInfo}>
                      <Text weight="medium">{seller.productName}</Text>
                      <Text size="xs" color="secondary">
                        {seller.totalQuantity} terjual
                      </Text>
                    </View>
                    <Text weight="semibold" color="success">
                      Rp {seller.totalRevenue.toLocaleString('id-ID')}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </Card>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  rangeRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  rangeButton: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  period: { marginBottom: spacing.lg },
  sectionTitle: { marginBottom: spacing.sm },
  emptyBest: { padding: spacing.xl, alignItems: 'center' },
  emptyBestIcon: { fontSize: 40, marginBottom: spacing.sm },
  bestRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  bestRank: { width: 24, color: colors.text.muted, fontWeight: '700', fontSize: 16 },
  bestInfo: { flex: 1 },
});
