import { Image, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/dataDisplay';
import { isBundle } from '@/utils/bundles';
import { firstStep } from '@/utils/priceTiers';
import type { BadgeVariant } from '@/components/ui/dataDisplay';
import { Card } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { emojiForProduct, lowStockThresholdOf, paletteColorFor } from '@/utils/productDisplay';
import { colors, radii, spacing, staggerDelay } from '@/theme';
import { FadeInView } from '@/components/ui/motion';
import type { Product } from '@/types/models';

export type ProductGridCardVariant = 'pos' | 'catalog';

interface ProductGridCardProps {
  item: Product;
  onPress?: () => void;
  tablet?: boolean;
  /**
   * 'pos' (default): kartu buat jual di Kasir — sisa stok ditampilkan polos & tap
   * dimatikan kalau stok habis. 'catalog': kartu buat kelola produk — status stok
   * pakai Badge dan tap tetap aktif walau stok habis (masih perlu bisa diedit).
   */
  variant?: ProductGridCardVariant;
  /** Posisi di grid — kartu muncul bergiliran (stagger) saat pertama tampil. */
  index?: number;
}

function stockStatus(item: Product): { label: string; variant: BadgeVariant } {
  if (item.stockQuantity <= 0) return { label: 'Habis', variant: 'error' };
  if (item.stockQuantity <= lowStockThresholdOf(item)) return { label: 'Menipis', variant: 'warning' };
  return { label: 'Aman', variant: 'success' };
}

export function ProductGridCard({ item, onPress, tablet, variant = 'pos', index = 0 }: ProductGridCardProps) {
  const outOfStock = item.stockQuantity <= 0;
  const lowStock = !outOfStock && item.stockQuantity <= lowStockThresholdOf(item);
  const stockColor = outOfStock ? 'error' : lowStock ? 'warning' : 'muted';
  const thumbnailColor = paletteColorFor(item.id);
  const disablePress = variant === 'pos' && outOfStock;
  const badge = variant === 'catalog' ? stockStatus(item) : null;

  return (
    <FadeInView delay={staggerDelay(index)} offsetY={14} fromScale={0.97} style={styles.cell}>
    <Card padding="none" style={[styles.card, outOfStock && styles.cardDisabled]} onPress={disablePress ? undefined : onPress}>
      <View
        style={[
          styles.imageWrap,
          tablet ? styles.imageWrapTablet : styles.imageWrapPhone,
          !item.imageUrl && { backgroundColor: thumbnailColor },
        ]}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <Text size={tablet ? '5xl' : '4xl'}>{isBundle(item) ? '🎁' : emojiForProduct(item)}</Text>
        )}
        {isBundle(item) ? (
          <View style={styles.bundleTag}>
            <Text size="xs" weight="bold" style={styles.bundleTagText}>
              PAKET
            </Text>
          </View>
        ) : null}
      </View>
      <View style={[styles.body, tablet && styles.bodyTablet]}>
        <Text size="xs" weight="semibold" numberOfLines={2} style={styles.name}>
          {item.productName}
        </Text>
        {firstStep(item) ? (
          <Text size="xs" weight="semibold" numberOfLines={1} style={styles.wholesale}>
            Grosir ≥{firstStep(item)!.minQuantity} {item.baseUnitName} · Rp{firstStep(item)!.unitPrice.toLocaleString('id-ID')}
          </Text>
        ) : null}
        <View style={styles.footer}>
          <Text size="xs" weight="bold">
            Rp {item.sellingPrice.toLocaleString('id-ID')}
          </Text>
          {badge ? (
            <Badge variant={badge.variant}>{badge.label}</Badge>
          ) : (
            <Text size="xs" weight="semibold" color={stockColor}>
              {outOfStock ? 'Stok habis' : `Stok ${item.stockQuantity}`}
            </Text>
          )}
        </View>
      </View>
    </Card>
    </FadeInView>
  );
}

const styles = StyleSheet.create({
  cell: { flex: 1 },
  card: { flex: 1, marginBottom: spacing.md, borderRadius: radii.xl, overflow: 'hidden' },
  cardDisabled: { opacity: 0.6 },
  // HP: thumbnail "inset" dengan sudut membulat di dalam kartu, seperti mockup.
  imageWrapPhone: { width: undefined, margin: spacing.sm, marginBottom: 0, borderRadius: radii.lg, overflow: 'hidden' },
  imageWrap: {
    width: '100%',
    aspectRatio: 1 / 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    borderTopLeftRadius: radii.lg,
    borderTopRightRadius: radii.lg,
  },
  imageWrapTablet: { aspectRatio: 1 / 0.85 },
  image: { width: '100%', height: '100%', borderTopLeftRadius: radii.lg, borderTopRightRadius: radii.lg },
  body: { padding: spacing.sm, flex: 1, justifyContent: 'space-between' },
  bodyTablet: { padding: 14 },
  name: { minHeight: 34 },
  wholesale: { color: colors.success[700], fontSize: 10, marginTop: 2 },
  bundleTag: {
    position: 'absolute',
    top: 6,
    left: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: colors.warning[500],
  },
  bundleTagText: { color: colors.white, fontSize: 10, letterSpacing: 0.5 },
  footer: { marginTop: spacing.xs, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
