import type { BadgeVariant } from '@/components/ui/dataDisplay';
import { LOW_STOCK_THRESHOLD } from '@/utils/productDisplay';
import type { Product } from '@/types/models';

export function productStockBadgeVariant(product: Product): BadgeVariant {
  if (product.stockQuantity <= 0) return 'error';
  if (product.stockQuantity <= LOW_STOCK_THRESHOLD) return 'warning';
  return 'neutral';
}
