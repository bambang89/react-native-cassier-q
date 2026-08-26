import { Image, StyleSheet, View } from 'react-native';

import { Badge } from '@/components/ui/dataDisplay';
import { Card } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { colors, spacing } from '@/theme';
import type { Product } from '@/types/models';

import { productStockBadgeVariant } from '../ProductsScreen.utils';

// Baris produk di daftar mode HP (SwipeList) — mode tablet pakai ProductGridCard
// dari '@/components/product' langsung di ProductsScreen.tsx.
export function ProductListItem({ item, onPress }: { item: Product; onPress: () => void }) {
  return (
    <Card onPress={onPress} style={styles.card} shadow="none">
      <View style={styles.row}>
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.rowImage} />
        ) : (
          <View style={styles.rowImagePlaceholder} />
        )}
        <View style={styles.info}>
          <Text weight="semibold" numberOfLines={1}>
            {item.productName}
          </Text>
          <Text size="xs" color="secondary">
            {item.sku} · {item.categoryName}
          </Text>
        </View>
        <View style={styles.right}>
          <Text weight="bold" color="link">
            Rp {item.sellingPrice.toLocaleString('id-ID')}
          </Text>
          <Badge variant={productStockBadgeVariant(item)}>{`${item.stockQuantity} ${item.baseUnitName}`}</Badge>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowImage: { width: 40, height: 40, borderRadius: 6, marginRight: spacing.sm, backgroundColor: colors.gray[100] },
  rowImagePlaceholder: { width: 40, height: 40, borderRadius: 6, marginRight: spacing.sm, backgroundColor: colors.gray[100] },
  info: { flex: 1, marginRight: spacing.sm },
  right: { alignItems: 'flex-end', gap: spacing.xs },
});
