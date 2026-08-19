import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSalesSummary } from '@/store/slices/reportsSlice';
import { fetchStoreProfile } from '@/store/slices/storeProfileSlice';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, radii, spacing } from '@/theme';
import { tabletColors } from '@/theme/tabletColors';
import { Button } from '@/components/ui/forms';
import { Divider } from '@/components/ui/dataDisplay';
import { Card, Header, KpiCard, TabletTopBar } from '@/components/ui/recipes';
import { BarChartIcon, CalendarIcon, ReceiptIcon, RegisterIcon, TrophyIcon } from '@/components/icons/LineIcons';
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
  const { isTabletLandscape } = useResponsive();
  const [range, setRange] = useState<RangeOption>(7);
  const summary = useAppSelector((state) => state.reports.summary);
  const status = useAppSelector((state) => state.reports.status);
  const user = useAppSelector((state) => state.auth.user);
  const storeProfile = useAppSelector((state) => state.storeProfile.profile);
  const loading = status === 'loading';

  const load = (days: RangeOption) => {
    dispatch(fetchSalesSummary(rangeParams(days)));
  };

  useEffect(() => {
    load(range);
    dispatch(fetchStoreProfile());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const primaryRole = user?.roles?.[0] ?? null;
  const storeName = storeProfile?.storeName ?? primaryRole?.storeName ?? '-';

  const rangeSwitcher = isTabletLandscape ? (
    <View style={styles.pillTabs}>
      <Pressable style={[styles.pillTab, range === 7 && styles.pillTabActive]} onPress={() => setRange(7)}>
        <Text style={[styles.pillTabLabel, range === 7 && styles.pillTabLabelActive]}>7 Hari</Text>
      </Pressable>
      <Pressable style={[styles.pillTab, range === 30 && styles.pillTabActive]} onPress={() => setRange(30)}>
        <Text style={[styles.pillTabLabel, range === 30 && styles.pillTabLabelActive]}>30 Hari</Text>
      </Pressable>
    </View>
  ) : null;

  return (
    <SafeAreaView style={[styles.container, isTabletLandscape && styles.containerTablet]} edges={['top', 'left', 'right']}>
      {isTabletLandscape ? (
        <TabletTopBar
          title="Laporan"
          subtitle={summary ? `Periode ${summary.from} — ${summary.to}` : 'Ringkasan penjualan'}
          storeName={storeName}
          userName={user?.name ?? 'Kasir'}
          rightAction={rangeSwitcher}
        />
      ) : (
        <>
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
        </>
      )}

      {!summary ? (
        <View style={styles.center}>
          <ActivityIndicator />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.body, isTabletLandscape && styles.bodyTablet]}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={() => load(range)} />}
        >
          <View style={[styles.statsRow, isTabletLandscape && styles.statsRowTablet]}>
            <KpiCard
              icon={RegisterIcon}
              iconColor={isTabletLandscape ? tabletColors.emerald600 : colors.success[600]}
              iconBg={isTabletLandscape ? tabletColors.emerald50 : colors.success[50]}
              label="Total Penjualan"
              value={`Rp ${summary.grossSales.toLocaleString('id-ID')}`}
            />
            <KpiCard
              icon={ReceiptIcon}
              iconColor={isTabletLandscape ? tabletColors.blue600 : colors.primary[600]}
              iconBg={isTabletLandscape ? tabletColors.blue50 : colors.primary[50]}
              label="Jumlah Transaksi"
              value={String(summary.orderCount)}
            />
          </View>

          {!isTabletLandscape ? (
            <View style={styles.periodRow}>
              <CalendarIcon size={14} color={colors.text.muted} />
              <Text size="sm" color="muted">
                Periode: {summary.from} — {summary.to}
              </Text>
            </View>
          ) : null}

          <View style={styles.sectionTitleRow}>
            <TrophyIcon size={16} color={colors.text.primary} />
            <Text weight="bold" size="lg">
              Produk Terlaris
            </Text>
          </View>
          <Card padding="none" shadow="sm">
            {summary.topSellers.length === 0 ? (
              <View style={styles.emptyBest}>
                <View style={styles.emptyBestGlyph}>
                  <BarChartIcon size={22} color={colors.primary[600]} />
                </View>
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  containerTablet: { backgroundColor: tabletColors.gray25 },
  rangeRow: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  rangeButton: { flex: 1 },
  pillTabs: { flexDirection: 'row', backgroundColor: tabletColors.gray100, borderRadius: 999, padding: 3 },
  pillTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999 },
  pillTabActive: { backgroundColor: tabletColors.white },
  pillTabLabel: { fontSize: 12.5, fontWeight: '600', color: tabletColors.gray500 },
  pillTabLabelActive: { color: tabletColors.gray900 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  bodyTablet: { paddingVertical: 22, paddingHorizontal: 24 },
  statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  statsRowTablet: { gap: 16, marginBottom: 18 },
  periodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.lg },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  emptyBest: { padding: spacing.xl, alignItems: 'center' },
  emptyBestGlyph: {
    width: 56,
    height: 56,
    borderRadius: radii.xl,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  bestRow: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, gap: spacing.sm },
  bestRank: { width: 24, color: colors.text.muted, fontWeight: '700', fontSize: 16 },
  bestInfo: { flex: 1 },
});
