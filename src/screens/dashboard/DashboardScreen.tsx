import { useEffect, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Rect, Stop } from 'react-native-svg';

import { fetchSalesSummary } from '@/api/reportsApi';
import type { SalesSummary } from '@/types/models';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStoreProfile } from '@/store/slices/storeProfileSlice';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, radii, spacing } from '@/theme';
import { tabletColors } from '@/theme/tabletColors';
import { Card, Header, KpiCard, TabletTopBar } from '@/components/ui/recipes';
import { Heading, Text } from '@/components/ui/typography';
import { BarChartIcon, BoxIcon, LightbulbIcon, ReceiptIcon, RegisterIcon, TrendingIcon } from '@/components/icons/LineIcons';

const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function fetchLastSevenDays(): Promise<SalesSummary[]> {
  const today = new Date();
  const requests = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() - (6 - i));
    const iso = isoDate(date);
    return fetchSalesSummary({ from: iso, to: iso });
  });
  return Promise.all(requests);
}

function formatRupiah(value: number): string {
  return `Rp ${Math.round(value).toLocaleString('id-ID')}`;
}

function percentDelta(today: number, yesterday: number): number | null {
  if (yesterday <= 0) return null;
  return ((today - yesterday) / yesterday) * 100;
}

function mergeTopSellers(days: SalesSummary[], limit = 4) {
  const byProduct = new Map<string, { productId: string; productName: string; totalQuantity: number; totalRevenue: number }>();
  for (const day of days) {
    for (const seller of day.topSellers) {
      const existing = byProduct.get(seller.productId);
      if (existing) {
        existing.totalQuantity += seller.totalQuantity;
        existing.totalRevenue += seller.totalRevenue;
      } else {
        byProduct.set(seller.productId, { ...seller });
      }
    }
  }
  return Array.from(byProduct.values())
    .sort((a, b) => b.totalQuantity - a.totalQuantity)
    .slice(0, limit);
}

export default function DashboardScreen() {
  const dispatch = useAppDispatch();
  const { isTabletLandscape } = useResponsive();
  const user = useAppSelector((state) => state.auth.user);
  const storeProfile = useAppSelector((state) => state.storeProfile.profile);
  const [days, setDays] = useState<SalesSummary[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const result = await fetchLastSevenDays();
      setDays(result);
    } catch {
      // Biarkan `days` tetap null — UI menampilkan state kosong, bukan data palsu.
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    dispatch(fetchStoreProfile());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const primaryRole = user?.roles?.[0] ?? null;
  const storeName = storeProfile?.storeName ?? primaryRole?.storeName ?? '-';
  const firstName = user?.name?.split(' ')[0] ?? 'Kasir';

  const today = days?.[6] ?? null;
  const yesterday = days?.[5] ?? null;
  const todayUnitsSold = today ? today.topSellers.reduce((sum, s) => sum + s.totalQuantity, 0) : 0;
  const yesterdayUnitsSold = yesterday ? yesterday.topSellers.reduce((sum, s) => sum + s.totalQuantity, 0) : 0;
  const avgToday = today && today.orderCount > 0 ? today.grossSales / today.orderCount : 0;
  const weeklyTopSellers = days ? mergeTopSellers(days) : [];

  const kpi = isTabletLandscape
    ? {
        success: tabletColors.emerald600,
        successBg: tabletColors.emerald50,
        primary: tabletColors.blue600,
        primaryBg: tabletColors.blue50,
        teal: tabletColors.teal700,
        tealBg: tabletColors.teal50,
        warning: tabletColors.amber600,
        warningBg: tabletColors.amber50,
        muted: tabletColors.gray500,
        secondary: tabletColors.gray600,
        border100: tabletColors.gray100,
        thumbBg: tabletColors.gray100,
      }
    : {
        success: colors.success[600],
        successBg: colors.success[50],
        primary: colors.primary[600],
        primaryBg: colors.primary[50],
        teal: colors.teal[700],
        tealBg: colors.teal[50],
        warning: colors.warning[600],
        warningBg: colors.warning[50],
        muted: colors.text.muted,
        secondary: colors.text.secondary,
        border100: colors.border,
        thumbBg: colors.surface,
      };

  return (
    <SafeAreaView style={[styles.container, isTabletLandscape && styles.containerTablet]} edges={['top', 'left', 'right']}>
      {isTabletLandscape ? (
        <TabletTopBar
          title={`Selamat datang, ${firstName}`}
          subtitle="Ringkasan performa bisnis hari ini"
          storeName={storeName}
          userName={firstName}
        />
      ) : (
        <Header title={`Selamat datang, ${firstName}`} subtitle="Ringkasan performa bisnis hari ini" />
      )}

      <ScrollView
        contentContainerStyle={[styles.body, isTabletLandscape && styles.bodyTablet]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
      >
        <View style={[styles.kpiGrid, isTabletLandscape && styles.kpiGridTablet]}>
          <KpiCard
            style={[styles.kpiCard, isTabletLandscape && styles.kpiCardTablet]}
            label="Penjualan Hari Ini"
            value={today ? formatRupiah(today.grossSales) : '—'}
            icon={RegisterIcon}
            iconColor={kpi.success}
            iconBg={kpi.successBg}
            delta={today && yesterday ? percentDelta(today.grossSales, yesterday.grossSales) : null}
          />
          <KpiCard
            style={[styles.kpiCard, isTabletLandscape && styles.kpiCardTablet]}
            label="Transaksi"
            value={today ? String(today.orderCount) : '—'}
            icon={ReceiptIcon}
            iconColor={kpi.primary}
            iconBg={kpi.primaryBg}
            delta={today && yesterday ? percentDelta(today.orderCount, yesterday.orderCount) : null}
          />
          <KpiCard
            style={[styles.kpiCard, isTabletLandscape && styles.kpiCardTablet]}
            label="Rata-rata"
            value={today ? formatRupiah(avgToday) : '—'}
            icon={TrendingIcon}
            iconColor={kpi.teal}
            iconBg={kpi.tealBg}
          />
          <KpiCard
            style={[styles.kpiCard, isTabletLandscape && styles.kpiCardTablet]}
            label="Produk Terjual"
            value={today ? String(todayUnitsSold) : '—'}
            icon={BoxIcon}
            iconColor={kpi.warning}
            iconBg={kpi.warningBg}
            delta={today && yesterday ? percentDelta(todayUnitsSold, yesterdayUnitsSold) : null}
          />
        </View>

        {today && today.orderCount > 0 ? (
          isTabletLandscape ? (
            <View style={styles.insightCardTablet}>
              <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
                <Defs>
                  <LinearGradient id="insightGrad" x1="0" y1="0" x2="1" y2="1">
                    <Stop offset="0%" stopColor={tabletColors.navy900} />
                    <Stop offset="55%" stopColor="#0E3355" />
                    <Stop offset="100%" stopColor={tabletColors.teal700} />
                  </LinearGradient>
                </Defs>
                <Rect x={0} y={0} width="100%" height="100%" fill="url(#insightGrad)" />
              </Svg>
              <View style={styles.insightIconTablet}>
                <LightbulbIcon size={17} color={tabletColors.white} />
              </View>
              <View style={styles.insightBody}>
                <Text style={styles.insightLabelTablet}>INSIGHT CASSIER-Q</Text>
                <Text style={styles.insightTextTablet}>
                  {`Hari ini tercatat ${today.orderCount} transaksi dengan total ${formatRupiah(today.grossSales)}. ${
                    weeklyTopSellers.length > 0
                      ? `${weeklyTopSellers[0].productName} jadi produk terlaris minggu ini.`
                      : ''
                  }`}
                </Text>
              </View>
            </View>
          ) : (
            <Card style={styles.insightCard}>
              <View style={styles.insightIcon}>
                <LightbulbIcon size={18} color={colors.primary[600]} />
              </View>
              <View style={styles.insightBody}>
                <Text weight="semibold" size="sm" style={styles.insightLabel}>
                  Insight cassier-Q
                </Text>
                <Text size="sm" color="secondary">
                  {`Hari ini tercatat ${today.orderCount} transaksi dengan total ${formatRupiah(today.grossSales)}. ${
                    weeklyTopSellers.length > 0
                      ? `${weeklyTopSellers[0].productName} jadi produk terlaris minggu ini.`
                      : ''
                  }`}
                </Text>
              </View>
            </Card>
          )
        ) : null}

        <View style={[styles.bottomRow, isTabletLandscape && styles.bottomRowTablet]}>
          <Card style={styles.chartCard}>
            <View style={styles.cardHead}>
              <View>
                <Heading level="h5">Grafik Penjualan</Heading>
                <Text size="xs" color="muted" style={styles.cardHeadSub}>
                  7 hari terakhir
                </Text>
              </View>
              <BarChartIcon size={16} color={kpi.muted} />
            </View>
            {days ? (
              <SalesTrendChart
                values={days.map((d) => d.grossSales)}
                labels={DAY_LABELS}
                lineColor={isTabletLandscape ? tabletColors.blue600 : colors.primary[600]}
              />
            ) : (
              <View style={styles.chartLoading}>
                <Text size="sm" color="muted">
                  Memuat data...
                </Text>
              </View>
            )}
          </Card>

          <Card style={styles.topSellersCard}>
            <Heading level="h5" style={styles.cardHead}>
              Produk Terlaris
            </Heading>
            {weeklyTopSellers.length === 0 ? (
              <Text size="sm" color="muted" style={styles.topSellersEmpty}>
                Belum ada penjualan minggu ini.
              </Text>
            ) : (
              weeklyTopSellers.map((seller) => (
                <View
                  key={seller.productId}
                  style={[styles.topSellerRow, isTabletLandscape && { borderBottomColor: kpi.border100 }]}
                >
                  <View style={[styles.topSellerThumb, isTabletLandscape && { backgroundColor: kpi.thumbBg }]}>
                    <BoxIcon size={15} color={kpi.secondary} />
                  </View>
                  <View style={styles.topSellerInfo}>
                    <Text weight="semibold" size="sm" numberOfLines={1}>
                      {seller.productName}
                    </Text>
                    <Text size="xs" color="muted">
                      {seller.totalQuantity}x terjual
                    </Text>
                  </View>
                  <Text weight="bold" size="sm">
                    {formatRupiah(seller.totalRevenue / seller.totalQuantity)}
                  </Text>
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SalesTrendChart({ values, labels, lineColor }: { values: number[]; labels: string[]; lineColor: string }) {
  const width = 620;
  const height = 160;
  const padding = 8;
  const max = Math.max(...values, 1);
  const points = values.map((v, i) => ({
    x: padding + (i * (width - padding * 2)) / (values.length - 1),
    y: padding + (1 - v / max) * (height - padding * 2),
  }));

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity={0.16} />
            <Stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Path d={areaPath} fill="url(#areaGrad)" />
        <Path d={linePath} fill="none" stroke={lineColor} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
      <View style={styles.chartLabelRow}>
        {labels.map((label) => (
          <Text key={label} size="xs" color="muted" style={styles.chartLabel}>
            {label}
          </Text>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  containerTablet: { backgroundColor: tabletColors.gray25 },
  body: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  bodyTablet: { paddingVertical: 22, paddingHorizontal: 24 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  kpiGridTablet: { flexWrap: 'nowrap', gap: 16 },
  kpiCard: { flexBasis: '47%', flexGrow: 1 },
  kpiCardTablet: { flexBasis: 0 },
  insightCard: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.base,
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[100],
  },
  insightCardTablet: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    marginTop: spacing.base,
    padding: 20,
    borderRadius: radii.lg,
    overflow: 'hidden',
  },
  insightIconTablet: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightLabelTablet: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#8FE0C2',
    marginBottom: 4,
  },
  insightTextTablet: { fontSize: 13.5, lineHeight: 21.6, color: '#E4ECF6' },
  insightIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  insightBody: { flex: 1 },
  insightLabel: { marginBottom: 2 },
  bottomRow: { gap: spacing.base, marginTop: spacing.base },
  bottomRowTablet: { flexDirection: 'row', alignItems: 'flex-start', gap: 18, marginTop: 18 },
  chartCard: { flex: 1.6 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  cardHeadSub: { marginTop: 1 },
  chartLoading: { height: 160, alignItems: 'center', justifyContent: 'center' },
  chartLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  chartLabel: { flex: 1, textAlign: 'center' },
  topSellersCard: { flex: 1 },
  topSellersEmpty: { paddingVertical: spacing.lg, textAlign: 'center' },
  topSellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  topSellerThumb: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSellerInfo: { flex: 1 },
});
