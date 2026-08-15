import type { Product, ProductUnit } from '@/types/models';

/** Kalau backend belum menandai satuan mana pun, anggap base unit tetap berlaku (biar UI tidak macet). */
function fallbackBaseUnit(product: Product): ProductUnit {
  return {
    unitId: product.baseUnitId,
    unitName: product.baseUnitName,
    conversionToBase: 1,
    baseUnit: true,
    purchaseUnit: true,
    saleUnit: true,
  };
}

export function resolveSaleUnitChoices(units: ProductUnit[], product: Product): ProductUnit[] {
  const saleUnits = units.filter((u) => u.saleUnit);
  return saleUnits.length > 0 ? saleUnits : [fallbackBaseUnit(product)];
}

export function resolvePurchaseUnitChoices(units: ProductUnit[], product: Product): ProductUnit[] {
  const purchaseUnits = units.filter((u) => u.purchaseUnit);
  return purchaseUnits.length > 0 ? purchaseUnits : [fallbackBaseUnit(product)];
}
