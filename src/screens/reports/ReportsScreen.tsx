import { useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';

import * as reportsApi from '../../api/reportsApi';
import type { SalesSummary } from '../../types/models';
import { colors, spacing } from '../../theme';
import { Button } from '../../components/ui/forms';
import { Divider } from '../../components/ui/dataDisplay';
import { Card, Header } from '../../components/ui/recipes';
import { Heading, Text } from '../../components/ui/typography';

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
  const [range, setRange] = useState<RangeOption>(7);
  const [summary, setSummary] = useState<SalesSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async (days: RangeOption) => {
    setLoading(true);
    try {
      setSummary(await reportsApi.fetchSalesSummary(rangeParams(days)));
    } finally {
      setLoading(false);
    }
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
            <Card style={styles.statCard}>
              <Text size="xs" color="secondary">
                Total Penjualan
              </Text>
              <Heading level="h4" style={styles.statValue}>
                Rp {summary.grossSales.toLocaleString('id-ID')}
              </Heading>
            </Card>
            <Card style={styles.statCard}>
              <Text size="xs" color="secondary">
                Jumlah Transaksi
              </Text>
              <Heading level="h4" style={styles.statValue}>
                {summary.orderCount}
              </Heading>
            </Card>
          </View>

          <Text size="xs" color="muted" style={styles.period}>
            Periode: {summary.from} — {summary.to}
          </Text>

          <Text weight="semibold" style={styles.sectionTitle}>
            Produk Terlaris
          </Text>
          <Card padding="none" shadow="sm">
            {summary.topSellers.length === 0 ? (
              <Text color="muted" align="center" style={styles.emptyBest}>
                Belum ada penjualan di periode ini
              </Text>
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
  statCard: { flex: 1 },
  statValue: { marginTop: spacing.xs },
  period: { marginBottom: spacing.lg },
  sectionTitle: { marginBottom: spacing.sm },
  emptyBest: { padding: spacing.lg },
  bestRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  bestRank: { width: 20, color: colors.text.muted, fontWeight: '700' },
  bestInfo: { flex: 1 },
});
