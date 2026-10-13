import type { Product } from '@/types/models';

/** True for a paket bundling product. */
export const isBundle = (product: Pick<Product, 'productType'>) => product.productType === 'BUNDLE';

/** Short contents line, e.g. "1 Roti Tawar, 2 Susu Kotak". */
export function bundleContents(product: Product, limit = 3): string {
  const items = product.bundleItems ?? [];
  const text = items
    .slice(0, limit)
    .map((i) => `${Number(i.quantity)} ${i.productName}`)
    .join(', ');
  return items.length > limit ? `${text}, +${items.length - limit} lagi` : text;
}
