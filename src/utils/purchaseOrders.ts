import type { PurchaseOrder, PurchaseOrderItem } from '@/types/models';

/**
 * Status PO dari backend berupa string bebas. Kita tahu pasti nilainya "ORDERED" saat baru
 * dibuat (dari deskripsi endpoint create) dan bisa jadi "CANCELLED" (dari endpoint /cancel) —
 * di luar itu (mis. status "sudah diterima") kita HITUNG SENDIRI dari item-nya (bandingkan
 * receivedQuantityBaseUnit vs quantityBaseUnit), bukan menebak nama string yang belum pasti.
 * Ini lebih aman daripada salah terjemah status dan bikin toko salah kira soal barang mana
 * yang sudah/belum sampai.
 */
export function isCancelled(po: PurchaseOrder): boolean {
  const raw = po.status?.toUpperCase?.() ?? '';
  return raw === 'CANCELLED' || raw === 'CANCELED';
}

export function isFullyReceived(po: PurchaseOrder): boolean {
  const orderedBase = po.items.reduce((sum, i) => sum + i.quantityBaseUnit, 0);
  const receivedBase = po.items.reduce((sum, i) => sum + i.receivedQuantityBaseUnit, 0);
  return orderedBase > 0 && receivedBase >= orderedBase;
}

export function hasAnyReceived(po: PurchaseOrder): boolean {
  return po.items.some((item) => item.receivedQuantityBaseUnit > 0);
}

export function poStatusMeta(po: PurchaseOrder): { label: string; variant: 'success' | 'warning' | 'error' | 'neutral' } {
  if (isCancelled(po)) return { label: 'Dibatalkan', variant: 'error' };
  if (isFullyReceived(po)) return { label: 'Diterima Penuh', variant: 'success' };
  if (hasAnyReceived(po)) return { label: 'Diterima Sebagian', variant: 'warning' };
  return { label: 'Menunggu Diterima', variant: 'neutral' };
}

/** Sisa yang belum diterima, dalam satuan pembelian item ini (bukan base unit). */
export function remainingToReceive(item: PurchaseOrderItem): number {
  if (item.quantityBaseUnit <= 0) return 0;
  const receivedInUnit = item.quantity * (item.receivedQuantityBaseUnit / item.quantityBaseUnit);
  return Math.max(0, item.quantity - receivedInUnit);
}
