import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComponentType, ReactNode } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, Share, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { SalesSummary } from '@/types/models';
import { PAYMENT_METHODS } from '@/types/models';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchSalesSummary } from '@/store/slices/reportsSlice';
import { fetchStoreProfile } from '@/store/slices/storeProfileSlice';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, radii, spacing, staggerDelay } from '@/theme';
import { GradientBackground, Header, TabletTopBar } from '@/components/ui/recipes';
import { FadeInView } from '@/components/ui/motion';
import { Text } from '@/components/ui/typography';
import {
  BarChartIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClockIcon,
  CreditCardIcon,
  DiscountIcon,
  ReceiptIcon,
  RefundIcon,
  TrendDownIcon,
  TrendUpIcon,
  TrophyIcon,
  WalletIcon,
} from '@/components/icons/LineIcons';
import type { LineIconProps } from '@/components/icons/LineIcons';

// ── Periode ─────────────────────────────────────────────────────────────

type PeriodKey = 'today' | '7d' | '30d' | 'month';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: 'today', label: 'Hari ini' },
  { key: '7d', label: '7 Hari' },
  { key: '30d', label: '30 Hari' },
  { key: 'month', label: 'Bulan ini' },
];

/** yyyy-mm-dd in device (store) time. */
function isoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function parseDate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

/**
 * Date range for a period, shifted back `offset` times (offset 0 = current).
 * Calendar months shift by month; other periods by their own length.
 */
function rangeFor(key: PeriodKey, offset: number): { from: string; to: string } {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (key === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const end = offset === 0 ? today : new Date(start.getFullYear(), start.getMonth() + 1, 0);
    return { from: isoDate(start), to: isoDate(end) };
  }
  const length = key === 'today' ? 1 : key === '7d' ? 7 : 30;
  const end = new Date(today);
  end.setDate(end.getDate() - offset * length);
  const start = new Date(end);
  start.setDate(start.getDate() - (length - 1));
  return { from: isoDate(start), to: isoDate(end) };
}

function rangeLabel(from: string, to: string): string {
  const f = parseDate(from);
  const t = parseDate(to);
  const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  if (from === to) return f.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return `${f.toLocaleDateString('id-ID', opts)} – ${t.toLocaleDateString('id-ID', { ...opts, year: 'numeric' })}`;
}

// ── Format ──────────────────────────────────────────────────────────────

const rupiah = (value: number) => `Rp ${Math.round(value).toLocaleString('id-ID')}`;

/** Short Rupiah for compact labels: 1,2 jt / 350 rb. */
function shortRupiah(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt`;
  if (value >= 1_000) return `${Math.round(value / 1_000).toLocaleString('id-ID')} rb`;
  return Math.round(value).toLocaleString('id-ID');
}

function percentChange(current: number, previous: number | undefined): number | null {
  if (previous === undefined || previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

const methodLabel = (code: string) => PAYMENT_METHODS.find((m) => m.value === code)?.label ?? code;

const METHOD_COLORS = [colors.primary[600], colors.teal[600], colors.warning[500], colors.success[500], colors.gray[400]];

/** Plain-text summary for the share sheet (WhatsApp, etc.). */
function summaryText(storeName: string, s: SalesSummary): string {
  const lines = [
    `Laporan Penjualan ${storeName}`,
    rangeLabel(s.from, s.to),
    '',
    `Total penjualan : ${rupiah(s.grossSales)}`,
    `Transaksi       : ${s.orderCount}`,
    `Rata-rata       : ${rupiah(s.averageOrder ?? (s.orderCount ? s.grossSales / s.orderCount : 0))}`,
  ];
  if (s.discountTotal) lines.push(`Diskon          : ${rupiah(s.discountTotal)}`);
  if (s.taxTotal) lines.push(`PPN             : ${rupiah(s.taxTotal)}`);
  if (s.creditAmount) lines.push(`Piutang baru    : ${rupiah(s.creditAmount)}`);
  if (s.voidCount) lines.push(`Void            : ${s.voidCount} (${rupiah(s.voidAmount ?? 0)})`);
  if (s.topSellers.length) {
    lines.push('', 'Produk terlaris:');
    s.topSellers
      .slice(0, 5)
      .forEach((p, i) => lines.push(`${i + 1}. ${p.productName} — ${Number(p.totalQuantity)}x · ${rupiah(p.totalRevenue)}`));
  }
  return lines.join('\n');
}

// ── Layar ───────────────────────────────────────────────────────────────

export default function ReportsScreen() {
  const dispatch = useAppDispatch();
  const { isTabletLandscape } = useResponsive();
  const [period, setPeriod] = useState<PeriodKey>('7d');
  const [offset, setOffset] = useState(0);
  const [sortBy, setSortBy] = useState<'qty' | 'revenue'>('qty');
  const summary = useAppSelector((state) => state.reports.summary);
  const status = useAppSelector((state) => state.reports.status);
  const user = useAppSelector((state) => state.auth.user);
  const storeProfile = useAppSelector((state) => state.storeProfile.profile);
  const storeName = storeProfile?.storeName ?? user?.roles?.[0]?.storeName ?? '-';
  const range = useMemo(() => rangeFor(period, offset), [period, offset]);

  const load = useCallback(() => {
    dispatch(fetchSalesSummary({ ...range, top: 10 }));
  }, [dispatch, range]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    dispatch(fetchStoreProfile());
  }, [dispatch]);

  const changePeriod = (key: PeriodKey) => {
    setPeriod(key);
    setOffset(0);
  };

  // Laporan yang tampil harus milik periode yang dipilih (bukan sisa periode sebelumnya).
  const current = summary && summary.from === range.from && summary.to === range.to ? summary : null;
  const loading = status === 'loading';

  const share = () => {
    if (current) Share.share({ message: summaryText(storeName, current) }).catch(() => undefined);
  };

  const shareButton = (
    <Pressable onPress={share} disabled={!current} style={styles.shareButton} accessibilityLabel="Bagikan laporan">
      <Text size="sm" weight="semibold" style={{ color: colors.primary[600] }}>
        Bagikan
      </Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {isTabletLandscape ? (
        <TabletTopBar
          title="Laporan"
          subtitle={rangeLabel(range.from, range.to)}
          storeName={storeName}
          userName={user?.name ?? 'Kasir'}
          rightAction={shareButton}
        />
      ) : (
        <Header title="Laporan Penjualan" rightElement={shareButton} />
      )}

      <ScrollView
        contentContainerStyle={[styles.body, isTabletLandscape && styles.bodyTablet]}
        refreshControl={<RefreshControl refreshing={loading && !!current} onRefresh={load} tintColor={colors.primary[600]} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.periodWrap}>
          <View style={styles.segment}>
            {PERIODS.map((p) => {
              const active = p.key === period;
              return (
                <Pressable key={p.key} onPress={() => changePeriod(p.key)} style={[styles.segmentItem, active && styles.segmentItemActive]}>
                  <Text size="sm" weight="semibold" style={active ? styles.segmentTextActive : styles.segmentText}>
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View style={styles.rangeNav}>
            <Pressable onPress={() => setOffset((o) => o + 1)} style={styles.navButton} hitSlop={6} accessibilityLabel="Periode sebelumnya">
              <ChevronLeftIcon size={18} color={colors.gray[700]} />
            </Pressable>
            <Text size="sm" weight="semibold" style={styles.rangeText} numberOfLines={1}>
              {rangeLabel(range.from, range.to)}
            </Text>
            <Pressable
              onPress={() => setOffset((o) => Math.max(0, o - 1))}
              disabled={offset === 0}
              style={[styles.navButton, offset === 0 && styles.navButtonDisabled]}
              hitSlop={6}
              accessibilityLabel="Periode berikutnya"
            >
              <ChevronRightIcon size={18} color={offset === 0 ? colors.gray[300] : colors.gray[700]} />
            </Pressable>
          </View>
        </View>

        {!current ? (
          <View style={styles.center}>
            {status === 'failed' ? (
              <Text color="muted">Laporan gagal dimuat. Tarik ke bawah untuk mencoba lagi.</Text>
            ) : (
              <ActivityIndicator color={colors.primary[600]} />
            )}
          </View>
        ) : (
          <ReportContent summary={current} period={period} sortBy={sortBy} onSortBy={setSortBy} tablet={isTabletLandscape} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Isi laporan ─────────────────────────────────────────────────────────

function ReportContent({
  summary,
  period,
  sortBy,
  onSortBy,
  tablet,
}: {
  summary: SalesSummary;
  period: PeriodKey;
  sortBy: 'qty' | 'revenue';
  onSortBy: (value: 'qty' | 'revenue') => void;
  tablet: boolean;
}) {
  const salesDelta = percentChange(summary.grossSales, summary.previousGrossSales);
  const ordersDelta = percentChange(summary.orderCount, summary.previousOrderCount);
  const average = summary.averageOrder ?? (summary.orderCount ? summary.grossSales / summary.orderCount : 0);
  const empty = summary.orderCount === 0;
  const singleDay = period === 'today' || summary.from === summary.to;
  const days = summary.daily ?? [];

  const chart = (
    <Section icon={BarChartIcon} title={singleDay ? 'Penjualan per Jam' : 'Tren Penjualan'} delay={2}>
      {singleDay ? (
        <BarChart
          bars={(summary.hourly ?? [])
            .filter((h) => h.hour >= 6 && h.hour <= 23)
            .map((h) => ({ label: String(h.hour), value: h.grossSales, sub: `Pukul ${String(h.hour).padStart(2, '0')}.00 · ${h.orderCount} trx` }))}
          labelEvery={3}
        />
      ) : (
        <BarChart
          bars={days.map((d) => {
            const date = parseDate(d.date);
            return {
              label: days.length <= 7 ? date.toLocaleDateString('id-ID', { weekday: 'short' }) : String(date.getDate()),
              value: d.grossSales,
              sub: `${date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })} · ${d.orderCount} trx`,
            };
          })}
          labelEvery={days.length > 14 ? 5 : 1}
        />
      )}
    </Section>
  );

  const side = (
    <>
      <PaymentMethodsCard summary={summary} />
      {!singleDay ? <PeakHoursCard summary={summary} /> : null}
    </>
  );

  return (
    <>
      <FadeInView fromScale={0.97}>
        <View style={styles.hero}>
          <GradientBackground colors={[colors.darkBg, '#123E7A', colors.primary[600]]} />
          <View style={styles.heroGlow} />
          <Text size="xs" weight="semibold" style={styles.heroLabel}>
            TOTAL PENJUALAN
          </Text>
          <Text style={styles.heroValue} numberOfLines={1}>
            {rupiah(summary.grossSales)}
          </Text>
          <DeltaPill delta={salesDelta} />
          <View style={styles.heroStats}>
            <HeroStat label="Transaksi" value={String(summary.orderCount)} delta={ordersDelta} />
            <View style={styles.heroDivider} />
            <HeroStat label="Rata-rata" value={rupiah(average)} />
            <View style={styles.heroDivider} />
            <HeroStat label="Periode lalu" value={summary.previousGrossSales !== undefined ? rupiah(summary.previousGrossSales) : '—'} />
          </View>
        </View>
      </FadeInView>

      <View style={styles.kpiGrid}>
        <MiniKpi icon={DiscountIcon} tint={colors.success[600]} tintBg={colors.success[50]} label="Diskon" value={rupiah(summary.discountTotal ?? 0)} delay={1} />
        <MiniKpi icon={ReceiptIcon} tint={colors.primary[600]} tintBg={colors.primary[50]} label="PPN" value={rupiah(summary.taxTotal ?? 0)} delay={1} />
        <MiniKpi icon={CreditCardIcon} tint={colors.warning[600]} tintBg={colors.warning[50]} label="Piutang baru" value={rupiah(summary.creditAmount ?? 0)} delay={2} />
        <MiniKpi
          icon={RefundIcon}
          tint={colors.error[600]}
          tintBg={colors.error[50]}
          label="Void"
          value={summary.voidCount ? `${summary.voidCount} · ${shortRupiah(summary.voidAmount ?? 0)}` : '0'}
          delay={2}
        />
      </View>

      {empty ? (
        <View style={styles.emptyCard}>
          <View style={styles.emptyGlyph}>
            <BarChartIcon size={22} color={colors.primary[600]} />
          </View>
          <Text weight="semibold">Belum ada penjualan</Text>
          <Text size="sm" color="secondary" align="center">
            Tidak ada transaksi di periode ini. Coba pilih periode lain.
          </Text>
        </View>
      ) : tablet ? (
        <View style={styles.tabletRow}>
          <View style={styles.tabletMain}>
            {chart}
            <TopSellersCard summary={summary} sortBy={sortBy} onSortBy={onSortBy} />
          </View>
          <View style={styles.tabletSide}>{side}</View>
        </View>
      ) : (
        <>
          {chart}
          <TopSellersCard summary={summary} sortBy={sortBy} onSortBy={onSortBy} />
          {side}
        </>
      )}
    </>
  );
}

// ── Komponen kecil ──────────────────────────────────────────────────────

function DeltaPill({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <Text size="xs" style={[styles.heroMuted, styles.deltaNone]}>
        Belum ada pembanding dari periode sebelumnya
      </Text>
    );
  }
  const up = delta >= 0;
  return (
    <View style={[styles.deltaPill, up ? styles.deltaUp : styles.deltaDown]}>
      {up ? <TrendUpIcon size={12} color="#6EE7B7" /> : <TrendDownIcon size={12} color="#FCA5A5" />}
      <Text size="xs" weight="bold" style={{ color: up ? '#6EE7B7' : '#FCA5A5' }}>
        {`${up ? '+' : ''}${delta.toFixed(1)}% vs periode sebelumnya`}
      </Text>
    </View>
  );
}

function HeroStat({ label, value, delta }: { label: string; value: string; delta?: number | null }) {
  return (
    <View style={styles.heroStat}>
      <Text size="xs" style={styles.heroMuted}>
        {label}
      </Text>
      <Text weight="bold" style={styles.heroStatValue} numberOfLines={1}>
        {value}
      </Text>
      {delta !== undefined && delta !== null ? (
        <Text size="xs" weight="semibold" style={{ color: delta >= 0 ? '#6EE7B7' : '#FCA5A5' }}>
          {`${delta >= 0 ? '▲' : '▼'} ${Math.abs(delta).toFixed(0)}%`}
        </Text>
      ) : null}
    </View>
  );
}

function MiniKpi({
  icon: Icon,
  tint,
  tintBg,
  label,
  value,
  delay,
}: {
  icon: ComponentType<LineIconProps>;
  tint: string;
  tintBg: string;
  label: string;
  value: string;
  delay: number;
}) {
  return (
    <FadeInView delay={staggerDelay(delay)} style={styles.miniKpi}>
      <View style={[styles.miniIcon, { backgroundColor: tintBg }]}>
        <Icon size={16} color={tint} />
      </View>
      <View style={styles.flex}>
        <Text size="xs" color="muted" numberOfLines={1}>
          {label}
        </Text>
        <Text weight="bold" numberOfLines={1}>
          {value}
        </Text>
      </View>
    </FadeInView>
  );
}

function Section({
  icon: Icon,
  title,
  right,
  delay = 0,
  children,
}: {
  icon: ComponentType<LineIconProps>;
  title: string;
  right?: ReactNode;
  delay?: number;
  children: ReactNode;
}) {
  return (
    <FadeInView delay={staggerDelay(delay)} style={styles.section}>
      <View style={styles.sectionHead}>
        <View style={styles.sectionIcon}>
          <Icon size={15} color={colors.primary[600]} />
        </View>
        <Text weight="bold" style={styles.flex}>
          {title}
        </Text>
        {right}
      </View>
      {children}
    </FadeInView>
  );
}

/** Simple bar chart; tap a bar to see its value. The highest bar is shown by default. */
function BarChart({ bars, labelEvery }: { bars: { label: string; value: number; sub: string }[]; labelEvery: number }) {
  const max = Math.max(1, ...bars.map((b) => b.value));
  const peakIndex = bars.reduce((best, b, i) => (b.value > bars[best].value ? i : best), 0);
  const [selected, setSelected] = useState<number | null>(null);
  const shown = selected ?? peakIndex;
  const focus = bars[shown];

  return (
    <View>
      {focus ? (
        <View style={styles.chartFocus}>
          <Text size="xs" color="muted">
            {focus.sub}
            {selected === null ? ' · tertinggi' : ''}
          </Text>
          <Text weight="bold" style={styles.chartFocusValue}>
            {rupiah(focus.value)}
          </Text>
        </View>
      ) : null}
      <View style={styles.chart}>
        {bars.map((bar, index) => {
          const height = Math.max(3, (bar.value / max) * 120);
          const active = index === shown;
          return (
            <Pressable key={`${bar.label}-${index}`} style={styles.barSlot} onPress={() => setSelected(index === selected ? null : index)}>
              <View style={[styles.bar, { height }, active ? styles.barActive : bar.value === 0 ? styles.barEmpty : null]} />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.chartLabels}>
        {bars.map((bar, index) => (
          <Text key={`${bar.label}-l-${index}`} size="xs" color={index === shown ? 'link' : 'muted'} style={styles.barLabel} numberOfLines={1}>
            {index % labelEvery === 0 || index === shown ? bar.label : ''}
          </Text>
        ))}
      </View>
    </View>
  );
}

function TopSellersCard({
  summary,
  sortBy,
  onSortBy,
}: {
  summary: SalesSummary;
  sortBy: 'qty' | 'revenue';
  onSortBy: (value: 'qty' | 'revenue') => void;
}) {
  const sellers = useMemo(
    () => [...summary.topSellers].sort((a, b) => (sortBy === 'qty' ? b.totalQuantity - a.totalQuantity : b.totalRevenue - a.totalRevenue)),
    [summary.topSellers, sortBy],
  );
  const max = Math.max(1, ...sellers.map((s) => (sortBy === 'qty' ? s.totalQuantity : s.totalRevenue)));

  return (
    <Section
      icon={TrophyIcon}
      title="Produk Terlaris"
      delay={3}
      right={
        <View style={styles.miniSegment}>
          {(['qty', 'revenue'] as const).map((key) => (
            <Pressable key={key} onPress={() => onSortBy(key)} style={[styles.miniSegmentItem, sortBy === key && styles.miniSegmentItemActive]}>
              <Text size="xs" weight="semibold" style={sortBy === key ? styles.segmentTextActive : styles.segmentText}>
                {key === 'qty' ? 'Jumlah' : 'Omzet'}
              </Text>
            </Pressable>
          ))}
        </View>
      }
    >
      {sellers.length === 0 ? (
        <Text size="sm" color="muted" style={styles.sectionEmpty}>
          Belum ada produk terjual.
        </Text>
      ) : (
        sellers.map((seller, index) => {
          const metric = sortBy === 'qty' ? seller.totalQuantity : seller.totalRevenue;
          return (
            <View key={seller.productId} style={[styles.sellerRow, index > 0 && styles.sellerDivider]}>
              <View style={[styles.rank, index === 0 ? styles.rankGold : index < 3 ? styles.rankTop : null]}>
                <Text
                  size="xs"
                  weight="bold"
                  style={index === 0 ? { color: colors.warning[700] } : index < 3 ? { color: colors.primary[700] } : undefined}
                >
                  {index + 1}
                </Text>
              </View>
              <View style={styles.flex}>
                <View style={styles.sellerTop}>
                  <Text weight="semibold" numberOfLines={1} style={styles.flex}>
                    {seller.productName}
                  </Text>
                  <Text weight="bold" style={{ color: colors.success[700] }}>
                    {rupiah(seller.totalRevenue)}
                  </Text>
                </View>
                <View style={styles.sellerBottom}>
                  <View style={styles.track}>
                    <View style={[styles.trackFill, { width: `${(metric / max) * 100}%` }]} />
                  </View>
                  <Text size="xs" color="muted" style={styles.sellerQty}>
                    {Number(seller.totalQuantity).toLocaleString('id-ID')} terjual
                  </Text>
                </View>
              </View>
            </View>
          );
        })
      )}
    </Section>
  );
}

function PaymentMethodsCard({ summary }: { summary: SalesSummary }) {
  const rows = [
    ...(summary.paymentMethods ?? []).map((m) => ({ label: methodLabel(m.method), amount: m.amount, count: m.orderCount as number | null })),
    ...((summary.creditAmount ?? 0) > 0 ? [{ label: 'Utang pelanggan', amount: summary.creditAmount ?? 0, count: null as number | null }] : []),
  ];
  const total = rows.reduce((sum, r) => sum + r.amount, 0);
  if (rows.length === 0) return null;

  return (
    <Section icon={WalletIcon} title="Metode Pembayaran" delay={4}>
      <View style={styles.stack}>
        {rows.map((r, i) => (
          <View key={r.label} style={{ flex: Math.max(r.amount, 0.0001), backgroundColor: METHOD_COLORS[i % METHOD_COLORS.length] }} />
        ))}
      </View>
      {rows.map((r, i) => (
        <View key={r.label} style={styles.methodRow}>
          <View style={[styles.dot, { backgroundColor: METHOD_COLORS[i % METHOD_COLORS.length] }]} />
          <Text size="sm" style={styles.flex} numberOfLines={1}>
            {r.label}
            {r.count !== null ? (
              <Text size="xs" color="muted">
                {`  ${r.count} trx`}
              </Text>
            ) : null}
          </Text>
          <Text size="sm" weight="semibold">
            {rupiah(r.amount)}
          </Text>
          <Text size="xs" color="muted" style={styles.percent}>
            {total > 0 ? `${Math.round((r.amount / total) * 100)}%` : '-'}
          </Text>
        </View>
      ))}
    </Section>
  );
}

function PeakHoursCard({ summary }: { summary: SalesSummary }) {
  const hours = (summary.hourly ?? []).filter((h) => h.hour >= 6 && h.hour <= 23);
  const peak = hours.reduce<(typeof hours)[number] | null>((best, h) => (!best || h.orderCount > best.orderCount ? h : best), null);
  if (!peak || peak.orderCount === 0) return null;
  const max = Math.max(1, ...hours.map((h) => h.orderCount));

  return (
    <Section icon={ClockIcon} title="Jam Ramai" delay={5}>
      <Text size="sm" color="secondary" style={styles.peakText}>
        Paling ramai pukul{' '}
        <Text size="sm" weight="bold">
          {`${String(peak.hour).padStart(2, '0')}.00–${String(peak.hour + 1).padStart(2, '0')}.00`}
        </Text>{' '}
        ({peak.orderCount} transaksi)
      </Text>
      <View style={styles.heatRow}>
        {hours.map((h) => (
          <View key={h.hour} style={styles.heatCell}>
            <View
              style={[
                styles.heatBlock,
                h.orderCount === 0
                  ? { backgroundColor: colors.gray[100] }
                  : { backgroundColor: colors.primary[600], opacity: 0.25 + 0.75 * (h.orderCount / max) },
              ]}
            />
          </View>
        ))}
      </View>
      <View style={styles.heatLabels}>
        {['06', '09', '12', '15', '18', '21'].map((l) => (
          <Text key={l} size="xs" color="muted">
            {l}
          </Text>
        ))}
      </View>
    </Section>
  );
}

// ── Gaya ────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  flex: { flex: 1 },
  body: { padding: spacing.base, paddingBottom: spacing['3xl'], gap: spacing.md },
  bodyTablet: { paddingHorizontal: 24, paddingTop: 20 },
  center: { paddingVertical: spacing['3xl'], alignItems: 'center' },

  periodWrap: { gap: spacing.sm },
  segment: { flexDirection: 'row', padding: 4, borderRadius: radii.lg, backgroundColor: colors.gray[100] },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radii.md },
  segmentItemActive: {
    backgroundColor: colors.background,
    shadowColor: '#0B1F33',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentText: { color: colors.text.secondary },
  segmentTextActive: { color: colors.primary[700] },
  rangeNav: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  navButton: {
    width: 34,
    height: 34,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  navButtonDisabled: { opacity: 0.5 },
  rangeText: { flex: 1, textAlign: 'center', color: colors.text.primary },
  shareButton: {
    paddingHorizontal: spacing.md,
    height: 36,
    borderRadius: radii.md,
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary[100],
    backgroundColor: colors.primary[50],
  },

  hero: { padding: spacing.lg, borderRadius: radii['2xl'], overflow: 'hidden', backgroundColor: colors.darkBg },
  heroGlow: {
    position: 'absolute',
    right: -50,
    top: -60,
    width: 190,
    height: 190,
    borderRadius: 95,
    backgroundColor: 'rgba(96,165,250,0.22)',
  },
  heroLabel: { color: 'rgba(255,255,255,0.6)', letterSpacing: 1.2 },
  heroValue: { color: colors.white, fontSize: 32, lineHeight: 40, fontWeight: '800', marginTop: 2 },
  heroMuted: { color: 'rgba(255,255,255,0.65)' },
  deltaNone: { marginTop: spacing.sm },
  deltaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.full,
  },
  deltaUp: { backgroundColor: 'rgba(16,185,129,0.18)' },
  deltaDown: { backgroundColor: 'rgba(239,68,68,0.18)' },
  heroStats: {
    flexDirection: 'row',
    marginTop: spacing.base,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  heroStat: { flex: 1, gap: 2 },
  heroStatValue: { color: colors.white },
  heroDivider: { width: 1, marginHorizontal: spacing.sm, backgroundColor: 'rgba(255,255,255,0.12)' },

  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  miniKpi: {
    flexBasis: '48%',
    flexGrow: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  miniIcon: { width: 34, height: 34, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center' },

  section: {
    padding: spacing.base,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: spacing.md,
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionIcon: { width: 28, height: 28, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary[50] },
  sectionEmpty: { paddingVertical: spacing.md, textAlign: 'center' },

  chartFocus: { gap: 2 },
  chartFocusValue: { fontSize: 20, lineHeight: 26, color: colors.text.primary },
  chart: { flexDirection: 'row', alignItems: 'flex-end', height: 124, gap: 3 },
  barSlot: { flex: 1, height: '100%', justifyContent: 'flex-end' },
  bar: { borderTopLeftRadius: 5, borderTopRightRadius: 5, backgroundColor: colors.primary[200] },
  barActive: { backgroundColor: colors.primary[600] },
  barEmpty: { backgroundColor: colors.gray[100] },
  chartLabels: { flexDirection: 'row', gap: 3, marginTop: 6 },
  barLabel: { flex: 1, textAlign: 'center', fontSize: 11 },

  miniSegment: { flexDirection: 'row', padding: 3, borderRadius: radii.md, backgroundColor: colors.gray[100] },
  miniSegmentItem: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: radii.sm },
  miniSegmentItemActive: { backgroundColor: colors.background },
  sellerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  sellerDivider: { borderTopWidth: 1, borderTopColor: colors.gray[100] },
  rank: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.gray[100] },
  rankGold: { backgroundColor: colors.warning[100] },
  rankTop: { backgroundColor: colors.primary[50] },
  sellerTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sellerBottom: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 6 },
  track: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.gray[100], overflow: 'hidden' },
  trackFill: { height: '100%', borderRadius: 3, backgroundColor: colors.primary[500] },
  sellerQty: { minWidth: 70, textAlign: 'right' },

  stack: { flexDirection: 'row', height: 10, borderRadius: 5, overflow: 'hidden', gap: 2 },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 10, height: 10, borderRadius: 5 },
  percent: { width: 38, textAlign: 'right' },

  peakText: { lineHeight: 20 },
  heatRow: { flexDirection: 'row', gap: 3 },
  heatCell: { flex: 1 },
  heatBlock: { height: 26, borderRadius: 5 },
  heatLabels: { flexDirection: 'row', justifyContent: 'space-between' },

  emptyCard: {
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.xl,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  emptyGlyph: {
    width: 52,
    height: 52,
    borderRadius: radii.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[50],
    marginBottom: spacing.sm,
  },

  tabletRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-start' },
  tabletMain: { flex: 1.6, gap: spacing.md },
  tabletSide: { flex: 1, gap: spacing.md },
});
