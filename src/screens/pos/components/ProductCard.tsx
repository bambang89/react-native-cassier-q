import { Image, View } from 'react-native';

import { Card } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { emojiForProduct, paletteColorFor } from '@/utils/productDisplay';
import type { Product } from '@/types/models';

import { styles } from '../POSScreen.styles';
import { formatRupiah, LOW_STOCK_THRESHOLD } from '../POSScreen.utils';

export function ProductCard({ item, onPress, tablet }: { item: Product; onPress: () => void; tablet?: boolean }) {
  const outOfStock = item.stockQuantity <= 0;
  const lowStock = !outOfStock && item.stockQuantity <= LOW_STOCK_THRESHOLD;
  const stockColor = outOfStock ? 'error' : lowStock ? 'warning' : 'muted';
  const thumbnailColor = paletteColorFor(item.id);

  return (
    <Card padding="none" style={styles.card} onPress={outOfStock ? undefined : onPress}>
      <View
        style={[
          styles.cardImageWrap,
          tablet && styles.cardImageWrapTablet,
          !item.imageUrl && { backgroundColor: thumbnailColor },
        ]}
      >
        {item.imageUrl ? (
          <Image source={{ uri: item.imageUrl }} style={styles.cardImage} />
        ) : (
          <Text size={tablet ? '5xl' : '4xl'}>{emojiForProduct(item)}</Text>
        )}
      </View>
      <View style={[styles.cardBody, tablet && styles.cardBodyTablet]}>
        <Text size="xs" weight="semibold" numberOfLines={2} style={styles.cardName}>
          {item.productName}
        </Text>
        <View style={styles.cardFooter}>
          <Text size="xs" weight="bold">
            {formatRupiah(item.sellingPrice)}
          </Text>
          <Text size="xs" weight="semibold" color={stockColor}>
            {outOfStock ? 'Stok habis' : `Stok ${item.stockQuantity}`}
          </Text>
        </View>
      </View>
    </Card>
  );
}
