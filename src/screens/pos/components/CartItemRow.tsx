import { View } from 'react-native';

import { Text } from '@/components/ui/typography';
import { emojiForProduct, paletteColorFor } from '@/utils/productDisplay';
import type { CartItem } from '@/types/models';
import { useAppSelector } from '@/store/hooks';
import { baseTotals, linePricing, nextStep } from '@/utils/priceTiers';

import { styles } from '../POSScreen.styles';
import { formatRupiah } from '../POSScreen.utils';
import { QtyStepper } from './QtyStepper';

export function CartItemRow({ item, tablet }: { item: CartItem; tablet?: boolean }) {
  const cartItems = useAppSelector((state) => state.cart.items);
  const totals = baseTotals(cartItems);
  const pricing = linePricing(item, totals);
  const unitPrice = pricing.unitPrice;
  const next = nextStep(item.product, pricing.productTotalBase);
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
        <View style={styles.cartPriceRow}>
          {pricing.wholesale ? (
            <Text size="xs" color="muted" style={styles.cartPriceStrike}>
              {formatRupiah(pricing.normalUnitPrice)}
            </Text>
          ) : null}
          <Text size="xs" color={pricing.wholesale ? 'success' : 'muted'} weight={pricing.wholesale ? 'semibold' : undefined} style={tablet ? styles.cartRowPriceTablet : undefined}>
            {formatRupiah(unitPrice)}
            {pricing.wholesale ? ' · Grosir' : ''}
          </Text>
        </View>
        {next ? (
          <Text size="xs" style={styles.cartTierHint} numberOfLines={1}>
            +{Math.ceil(next.minQuantity - pricing.productTotalBase)} {item.product.baseUnitName} lagi → {formatRupiah(next.unitPrice)}/{item.product.baseUnitName}
          </Text>
        ) : null}
      </View>
      <QtyStepper item={item} tablet={tablet} />
    </View>
  );
}
