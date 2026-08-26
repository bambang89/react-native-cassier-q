import { Image, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/dataDisplay';
import type { BadgeVariant } from '@/components/ui/dataDisplay';
import { Card } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { emojiForProduct, LOW_STOCK_THRESHOLD, paletteColorFor } from '@/utils/productDisplay';
import { radii, spacing } from '@/theme';
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
}

function stockStatus(item: Product): { label: string; variant: BadgeVariant } {
  if (item.stockQuantity <= 0) return { label: 'Habis', variant: 'error' };
  if (item.stockQuantity <= LOW_STOCK_THRESHOLD) return { label: 'Menipis', variant: 'warning' };
  return { label: 'Aman', variant: 'success' };
}

export function ProductGridCard({ item, onPress, tablet, variant = 'pos' }: ProductGridCardProps) {
  const outOfStock = item.stockQuantity <= 0;
  const lowStock = !outOfStock && item.stockQuantity <= LOW_STOCK_THRESHOLD;
  const stockColor = outOfStock ? 'error' : lowStock ? 'warning' : 'muted';
  const thumbnailColor = paletteColorFor(item.id);
  const disablePress = variant === 'pos' && outOfStock;
  const badge = variant === 'catalog' ? stockStatus(item) : null;

  return (
    <Card padding="none" style={styles.card} onPress={disablePress ? undefined : onPress}>
      <View
        style={[
          styles.imageWrap,
          tablet && styles.imageWrapTablet,
          !item.imageUrl && { backgroundColor: thumbnailColor },
        ]}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.image} />
        ) : (
          <Text size={tablet ? '5xl' : '4xl'}>{emojiForProduct(item)}</Text>
        )}
      </View>
      <View style={[styles.body, tablet && styles.bodyTablet]}>
        <Text size="xs" weight="semibold" numberOfLines={2} style={styles.name}>
          {item.productName}
        </Text>
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
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, marginBottom: spacing.md, borderRadius: radii.lg, overflow: 'hidden' },
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
  footer: { marginTop: spacing.xs, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
});
