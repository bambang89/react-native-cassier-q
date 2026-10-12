import { useEffect, useRef, useState } from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { fetchSalesSummary } from '@/api/reportsApi';
import type { SalesSummary } from '@/types/models';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStoreProfile } from '@/store/slices/storeProfileSlice';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, motion, radii, spacing, staggerDelay } from '@/theme';
import { tabletColors } from '@/theme/tabletColors';
import { Card, GradientBackground, Header, KpiCard, TabletTopBar } from '@/components/ui/recipes';
import { Heading, Text } from '@/components/ui/typography';
import { FadeInView } from '@/components/ui/motion';
import {
  BarChartIcon,
  BoxIcon,
  LightbulbIcon,
  ReceiptIcon,
  RegisterIcon,
  TrendDownIcon,
  TrendingIcon,
  TrendUpIcon,
} from '@/components/icons/LineIcons';

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

  const insightText = today
    ? `Hari ini tercatat ${today.orderCount} transaksi dengan total ${formatRupiah(today.grossSales)}. ${
        weeklyTopSellers.length > 0 ? `${weeklyTopSellers[0].productName} jadi produk terlaris minggu ini.` : ''
      }`
    : '';
  const salesDelta = today && yesterday ? percentDelta(today.grossSales, yesterday.grossSales) : null;

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
        <Header title={`Halo, ${firstName} 👋`} subtitle={`${storeName} · ${todayLabel()}`} />
      )}

      <ScrollView
        contentContainerStyle={[styles.body, isTabletLandscape && styles.bodyTablet]}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={colors.primary[600]} />}
        showsVerticalScrollIndicator={false}
      >
        {isTabletLandscape ? (
          <View style={[styles.kpiGrid, styles.kpiGridTablet]}>
            {[
              { label: 'Penjualan Hari Ini', value: today ? formatRupiah(today.grossSales) : '—', icon: RegisterIcon, color: kpi.success, bg: kpi.successBg, delta: salesDelta },
              { label: 'Transaksi', value: today ? String(today.orderCount) : '—', icon: ReceiptIcon, color: kpi.primary, bg: kpi.primaryBg, delta: today && yesterday ? percentDelta(today.orderCount, yesterday.orderCount) : null },
              { label: 'Rata-rata', value: today ? formatRupiah(avgToday) : '—', icon: TrendingIcon, color: kpi.teal, bg: kpi.tealBg, delta: undefined },
              { label: 'Produk Terjual', value: today ? String(todayUnitsSold) : '—', icon: BoxIcon, color: kpi.warning, bg: kpi.warningBg, delta: today && yesterday ? percentDelta(todayUnitsSold, yesterdayUnitsSold) : null },
            ].map((item, index) => (
              <FadeInView key={item.label} delay={staggerDelay(index)} style={[styles.kpiCard, styles.kpiCardTablet]}>
                <KpiCard
                  style={styles.kpiFill}
                  label={item.label}
                  value={item.value}
                  icon={item.icon}
                  iconColor={item.color}
                  iconBg={item.bg}
                  delta={item.delta}
                />
              </FadeInView>
            ))}
          </View>
        ) : (
          <>
            <FadeInView fromScale={0.96}>
              <View style={styles.hero}>
                <GradientBackground colors={[colors.darkBg, '#123E7A', colors.primary[600]]} />
                <View style={styles.heroGlow} />
                <View style={styles.heroHead}>
                  <Text size="sm" weight="medium" style={styles.heroLabel}>
                    Penjualan Hari Ini
                  </Text>
                  <View style={styles.heroIcon}>
                    <RegisterIcon size={17} color={colors.white} />
                  </View>
                </View>
                <Text style={styles.heroValue} numberOfLines={1} adjustsFontSizeToFit>
                  {today ? formatRupiah(today.grossSales) : '—'}
                </Text>
                <View style={styles.heroFoot}>
                  {salesDelta !== null ? (
                    <View style={[styles.heroDelta, salesDelta < 0 && styles.heroDeltaDown]}>
                      {salesDelta >= 0 ? (
                        <TrendUpIcon size={12} color="#6EE7B7" />
                      ) : (
                        <TrendDownIcon size={12} color="#FCA5A5" />
                      )}
                      <Text size="xs" weight="bold" style={{ color: salesDelta >= 0 ? '#6EE7B7' : '#FCA5A5' }}>
                        {`${salesDelta >= 0 ? '+' : ''}${salesDelta.toFixed(1)}% vs kemarin`}
                      </Text>
                    </View>
                  ) : (
                    <View />
                  )}
                  <Text size="xs" style={styles.heroAvg}>
                    {`Rata-rata ${today ? formatRupiah(avgToday) : '—'}`}
                  </Text>
                </View>
              </View>
            </FadeInView>
            <View style={styles.kpiGrid}>
              <FadeInView delay={staggerDelay(1)} style={styles.kpiCard}>
                <KpiCard
                  style={styles.kpiFill}
                  label="Transaksi"
                  value={today ? String(today.orderCount) : '—'}
                  icon={ReceiptIcon}
                  iconColor={kpi.primary}
                  iconBg={kpi.primaryBg}
                  delta={today && yesterday ? percentDelta(today.orderCount, yesterday.orderCount) : null}
                />
              </FadeInView>
              <FadeInView delay={staggerDelay(2)} style={styles.kpiCard}>
                <KpiCard
                  style={styles.kpiFill}
                  label="Produk Terjual"
                  value={today ? String(todayUnitsSold) : '—'}
                  icon={BoxIcon}
                  iconColor={kpi.warning}
                  iconBg={kpi.warningBg}
                  delta={today && yesterday ? percentDelta(todayUnitsSold, yesterdayUnitsSold) : null}
                />
              </FadeInView>
            </View>
          </>
        )}

        {today && today.orderCount > 0 ? (
          <FadeInView delay={staggerDelay(4)}>
            <View style={[styles.insightCard, isTabletLandscape && styles.insightCardTablet]}>
              <GradientBackground colors={[tabletColors.navy900, '#0E3355', tabletColors.teal700]} />
              <View style={styles.insightIconTablet}>
                <LightbulbIcon size={17} color={tabletColors.white} />
              </View>
              <View style={styles.insightBody}>
                <Text style={styles.insightLabelTablet}>INSIGHT CASSIER-Q</Text>
                <Text style={styles.insightTextTablet}>{insightText}</Text>
              </View>
            </View>
          </FadeInView>
        ) : null}

        <View style={[styles.bottomRow, isTabletLandscape && styles.bottomRowTablet]}>
          <FadeInView delay={staggerDelay(5)} style={styles.chartCard}>
            <Card>
              <View style={styles.cardHead}>
                <View>
                  <Heading level="h6" style={styles.cardTitle}>
                    Grafik Penjualan
                  </Heading>
                  <Text size="xs" color="muted" style={styles.cardHeadSub}>
                    7 hari terakhir
                  </Text>
                </View>
                <View style={styles.cardHeadIcon}>
                  <BarChartIcon size={16} color={kpi.primary} />
                </View>
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
          </FadeInView>

          <FadeInView delay={staggerDelay(6)} style={styles.topSellersCard}>
            <Card>
              <Heading level="h6" style={[styles.cardHead, styles.cardTitle]}>
                Produk Terlaris
              </Heading>
              {weeklyTopSellers.length === 0 ? (
                <Text size="sm" color="muted" style={styles.topSellersEmpty}>
                  Belum ada penjualan minggu ini.
                </Text>
              ) : (
                weeklyTopSellers.map((seller, index) => (
                  <FadeInView key={seller.productId} delay={staggerDelay(index, 420)} offsetY={0} offsetX={12}>
                    <View
                      style={[
                        styles.topSellerRow,
                        { borderBottomColor: kpi.border100 },
                        index === weeklyTopSellers.length - 1 && styles.topSellerRowLast,
                      ]}
                    >
                      <View style={[styles.topSellerRank, index === 0 && styles.topSellerRankFirst]}>
                        <Text size="xs" weight="bold" style={index === 0 ? styles.rankFirstLabel : undefined}>
                          {index + 1}
                        </Text>
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
                        {formatRupiah(seller.totalRevenue)}
                      </Text>
                    </View>
                  </FadeInView>
                ))
              )}
            </Card>
          </FadeInView>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function todayLabel(): string {
  return new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
}

const AnimatedPath = Animated.createAnimatedComponent(Path);

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
  const lineLength = points.reduce(
    (sum, p, i) => (i === 0 ? 0 : sum + Math.hypot(p.x - points[i - 1].x, p.y - points[i - 1].y)),
    0,
  );

  // Garis "tergambar" dari kiri ke kanan, lalu area di bawahnya memudar masuk.
  const draw = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    draw.setValue(0);
    Animated.timing(draw, { toValue: 1, duration: 900, delay: 250, easing: motion.easing.out, useNativeDriver: false }).start();
  }, [draw, linePath]);

  return (
    <View>
      <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
        <Defs>
          <LinearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={lineColor} stopOpacity={0.18} />
            <Stop offset="100%" stopColor={lineColor} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <AnimatedPath d={areaPath} fill="url(#areaGrad)" opacity={draw} />
        <AnimatedPath
          d={linePath}
          fill="none"
          stroke={lineColor}
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={[lineLength, lineLength]}
          strokeDashoffset={draw.interpolate({ inputRange: [0, 1], outputRange: [lineLength, 0] })}
        />
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
  container: { flex: 1, backgroundColor: colors.canvas },
  containerTablet: { backgroundColor: tabletColors.gray25 },
  body: { padding: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.md },
  bodyTablet: { paddingVertical: 22, paddingHorizontal: 24, gap: 0 },
  hero: {
    backgroundColor: colors.darkBg,
    borderRadius: radii['2xl'],
    padding: spacing.lg,
    overflow: 'hidden',
    minHeight: 150,
  },
  heroGlow: {
    position: 'absolute',
    right: -40,
    top: -50,
    width: 170,
    height: 170,
    borderRadius: 85,
    backgroundColor: 'rgba(96,165,250,0.22)',
  },
  heroHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  heroLabel: { color: 'rgba(255,255,255,0.75)' },
  heroIcon: {
    width: 34,
    height: 34,
    borderRadius: radii.lg,
    backgroundColor: 'rgba(255,255,255,0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroValue: {
    marginTop: spacing.sm,
    fontSize: 32,
    lineHeight: 40,
    color: colors.white,
    fontFamily: 'Poppins_700Bold',
  },
  heroFoot: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  heroDelta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
    backgroundColor: 'rgba(16,185,129,0.18)',
  },
  heroDeltaDown: { backgroundColor: 'rgba(239,68,68,0.18)' },
  heroAvg: { color: 'rgba(255,255,255,0.7)' },
  kpiGrid: { flexDirection: 'row', gap: spacing.md },
  kpiGridTablet: { gap: 16 },
  kpiCard: { flex: 1 },
  kpiCardTablet: { flexBasis: 0 },
  kpiFill: { flex: 0 },
  insightCard: {
    backgroundColor: colors.darkBg,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'flex-start',
    padding: spacing.lg,
    borderRadius: radii.xl,
    overflow: 'hidden',
  },
  insightCardTablet: {
    marginTop: spacing.base,
    padding: 20,
    borderRadius: radii.lg,
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
  insightBody: { flex: 1 },
  bottomRow: { gap: spacing.md },
  bottomRowTablet: { flexDirection: 'row', alignItems: 'flex-start', gap: 18, marginTop: 18 },
  chartCard: { flex: 1.6 },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.sm },
  cardHeadSub: { marginTop: 1 },
  cardTitle: { fontSize: 16, lineHeight: 22 },
  cardHeadIcon: {
    width: 32,
    height: 32,
    borderRadius: radii.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topSellerRowLast: { borderBottomWidth: 0 },
  topSellerRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray[100],
    alignItems: 'center',
    justifyContent: 'center',
  },
  topSellerRankFirst: { backgroundColor: colors.warning[100] },
  rankFirstLabel: { color: colors.warning[700] },
  topSellerInfo: { flex: 1 },
});
