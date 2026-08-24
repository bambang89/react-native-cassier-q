import { View } from 'react-native';

import { Text } from '@/components/ui/typography';
import { emojiForProduct, paletteColorFor } from '@/utils/productDisplay';
import type { CartItem } from '@/types/models';

import { styles } from '../POSScreen.styles';
import { formatRupiah } from '../POSScreen.utils';
import { QtyStepper } from './QtyStepper';

export function CartItemRow({ item, tablet }: { item: CartItem; tablet?: boolean }) {
  const unitPrice = item.product.sellingPrice * item.unitConversionToBase;
  const thumbnailColor = paletteColorFor(item.product.id);
  return (
    <View style={[styles.cartRow, tablet && styles.cartRowTablet]}>
      <View style={[styles.cartRowThumbnail, tablet && styles.cartRowThumbnailTablet, { backgroundColor: thumbnailColor }]}>
        <Text size="lg">{emojiForProduct(item.product)}</Text>
      </View>
      <View style={styles.cartRowInfo}>
        <Text weight="semibold" numberOfLines={1} style={tablet ? styles.cartRowNameTablet : undefined}>
          {item.product.productName}
        </Text>
        <Text size="xs" color="muted" style={tablet ? styles.cartRowPriceTablet : undefined}>
          {formatRupiah(unitPrice)}
        </Text>
      </View>
      <QtyStepper item={item} tablet={tablet} />
    </View>
  );
}
