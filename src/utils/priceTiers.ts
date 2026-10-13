import type { CartItem, PriceTier, Product } from '@/types/models';

// Wholesale ("grosir") tiered prices. Same rule as the API (PriceTierService.pick):
// the product's total base quantity in the cart picks the highest step it reaches.

/** Steps sorted by minimum quantity. */
const stepsOf = (product: Product): PriceTier[] =>
  [...(product.priceTiers ?? [])].sort((a, b) => a.minQuantity - b.minQuantity);

/** Price per base unit for `totalBase` units of a product (normal price when no step is reached). */
export function basePriceFor(product: Product, totalBase: number): number {
  let price = product.sellingPrice;
  for (const step of stepsOf(product)) if (totalBase >= step.minQuantity) price = step.unitPrice;
  return price;
}

/** The next step the cashier can still reach, for a "buy N more" hint. */
export function nextStep(product: Product, totalBase: number): PriceTier | null {
  return stepsOf(product).find((step) => totalBase < step.minQuantity) ?? null;
}

/** Lowest step quantity, for a "Grosir mulai N" label. */
export function firstStep(product: Product): PriceTier | null {
  return stepsOf(product)[0] ?? null;
}

export type LinePricing = {
  /** Price per sold unit (base price × unit conversion). */
  unitPrice: number;
  /** Normal price per sold unit, before wholesale. */
  normalUnitPrice: number;
  subtotal: number;
  /** Total base quantity of this product across the cart. */
  productTotalBase: number;
  wholesale: boolean;
};

/** Total base quantity per product across the cart (dus + pcs are added together). */
export function baseTotals(items: CartItem[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const item of items) {
    totals.set(item.product.id, (totals.get(item.product.id) ?? 0) + item.quantity * item.unitConversionToBase);
  }
  return totals;
}

/** Price of one cart line, taking the product's wholesale step into account. */
export function linePricing(item: CartItem, totals: Map<string, number>): LinePricing {
  const productTotalBase = totals.get(item.product.id) ?? item.quantity * item.unitConversionToBase;
  const base = basePriceFor(item.product, productTotalBase);
  const unitPrice = base * item.unitConversionToBase;
  return {
    unitPrice,
    normalUnitPrice: item.product.sellingPrice * item.unitConversionToBase,
    subtotal: unitPrice * item.quantity,
    productTotalBase,
    wholesale: base < item.product.sellingPrice,
  };
}
