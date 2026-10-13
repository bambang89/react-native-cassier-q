import type { BadStockReason, BadStockStatus } from '@/types/models';

/** Rupiah, e.g. `Rp41.000` (negative values keep their sign). */
export const rupiah = (value: number) =>
  `${value < 0 ? '-' : ''}Rp${Math.abs(Math.round(value)).toLocaleString('id-ID')}`;

/** Number without trailing zeros, e.g. 12 or 1,5. */
export const qty = (value: number) => Number(value).toLocaleString('id-ID', { maximumFractionDigits: 3 });

/** Short Indonesian date-time, e.g. `13 Okt, 22.41`. */
export const dateTime = (iso: string) =>
  new Date(iso).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

export const REASONS: { value: BadStockReason; label: string; emoji: string }[] = [
  { value: 'DAMAGED', label: 'Rusak / pecah', emoji: '💥' },
  { value: 'EXPIRED', label: 'Kedaluwarsa', emoji: '⏰' },
  { value: 'LOST', label: 'Hilang', emoji: '❓' },
  { value: 'DEFECT', label: 'Cacat produksi', emoji: '⚠️' },
  { value: 'CUSTOMER_RETURN', label: 'Retur pembeli', emoji: '↩️' },
];

export const reasonLabel = (reason: BadStockReason) => REASONS.find((r) => r.value === reason)?.label ?? reason;

export const BS_STATUS: Record<BadStockStatus, { label: string; tone: 'warning' | 'primary' | 'success' | 'neutral' | 'error' }> = {
  PENDING: { label: 'Menunggu persetujuan', tone: 'warning' },
  QUARANTINED: { label: 'Dipisahkan', tone: 'primary' },
  RETURNED: { label: 'Diretur ke supplier', tone: 'success' },
  DISPOSED: { label: 'Dimusnahkan', tone: 'neutral' },
  CANCELLED: { label: 'Dibatalkan', tone: 'error' },
};

/** Label + direction (+1 in, -1 out) per stock movement type. */
export const MOVEMENT_TYPES: Record<string, { label: string; sign: 1 | -1 }> = {
  SALE: { label: 'Penjualan', sign: -1 },
  VOID_TRANSACTION: { label: 'Void transaksi', sign: 1 },
  STOCK_IN: { label: 'Restock', sign: 1 },
  PURCHASE: { label: 'Terima barang PO', sign: 1 },
  STOCK_OPNAME: { label: 'Stok opname', sign: 1 },
  BAD_STOCK: { label: 'Bad stock', sign: -1 },
  BAD_STOCK_CANCEL: { label: 'Batal bad stock', sign: 1 },
};
