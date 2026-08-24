import { PAYMENT_METHODS } from '@/types/models';
import type { Receipt } from '@/types/models';

// Lebar kolom ala kertas thermal 58mm (32 karakter font monospace) — dipakai
// buat versi teks yang di-share (WhatsApp dkk render monospace kalau
// dibungkus tanda kutip tiga, tapi tanpa itu pun tetap gampang dibaca).
const WIDTH = 32;

function money(value: number): string {
  return `Rp${Math.round(value).toLocaleString('id-ID')}`;
}

function center(text: string, width = WIDTH): string {
  if (text.length >= width) return text;
  return ' '.repeat(Math.floor((width - text.length) / 2)) + text;
}

function divider(char = '-', width = WIDTH): string {
  return char.repeat(width);
}

/** Rata kiri di `left`, rata kanan di `right`, dipisah spasi secukupnya. Kalau kepanjangan, `right` pindah baris baru rata kanan. */
function twoCol(left: string, right: string, width = WIDTH): string {
  const space = width - left.length - right.length;
  if (space >= 1) return left + ' '.repeat(space) + right;
  return `${left}\n${' '.repeat(Math.max(0, width - right.length))}${right}`;
}

export function paymentMethodLabel(method: string): string {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
}

/**
 * Baris terstruktur untuk render di layar (`ReceiptScreen`) — `pair` dirender
 * sebagai flex row (`justifyContent: 'space-between'`) supaya nominal harga
 * benar-benar rata ke tepi kanan kartu, bukan cuma diganjal spasi ala teks
 * monospace (yang gampang meleset kalau font tidak benar-benar fixed-width).
 */
export type ReceiptRow =
  | { kind: 'center'; text: string }
  | { kind: 'line'; text: string }
  | { kind: 'divider'; text: string }
  | { kind: 'pair'; label: string; value: string };

export function buildReceiptRows(receipt: Receipt): ReceiptRow[] {
  const rows: ReceiptRow[] = [];

  rows.push({ kind: 'center', text: receipt.storeName ?? 'cassier-Q' });
  if (receipt.storeAddress) rows.push({ kind: 'center', text: receipt.storeAddress });
  if (receipt.storePhone) rows.push({ kind: 'center', text: receipt.storePhone });
  rows.push({ kind: 'divider', text: divider('=') });
  rows.push({ kind: 'line', text: `No: ${receipt.transactionNumber}` });
  rows.push({ kind: 'line', text: `Tgl: ${new Date(receipt.transactionDate).toLocaleString('id-ID')}` });
  rows.push({ kind: 'line', text: `Kasir: ${receipt.cashierName}` });
  if (receipt.customerName) rows.push({ kind: 'line', text: `Pelanggan: ${receipt.customerName}` });
  rows.push({ kind: 'divider', text: divider('-') });

  for (const item of receipt.items) {
    rows.push({ kind: 'line', text: item.productName });
    rows.push({
      kind: 'pair',
      label: `  ${item.quantity} ${item.unitName} x ${money(item.unitPrice)}`,
      value: money(item.subtotal),
    });
  }

  rows.push({ kind: 'divider', text: divider('-') });
  rows.push({ kind: 'pair', label: 'Subtotal', value: money(receipt.subtotal) });
  if (receipt.discountAmount > 0) {
    rows.push({ kind: 'pair', label: 'Diskon', value: `-${money(receipt.discountAmount)}` });
  }
  if (receipt.taxAmount > 0) rows.push({ kind: 'pair', label: 'Pajak', value: money(receipt.taxAmount) });
  rows.push({ kind: 'pair', label: 'TOTAL', value: money(receipt.grandTotal) });
  rows.push({
    kind: 'pair',
    label: `Bayar (${paymentMethodLabel(receipt.paymentMethod)})`,
    value: money(receipt.paymentAmount),
  });
  rows.push({ kind: 'pair', label: 'Kembalian', value: money(receipt.changeAmount) });

  if (receipt.debtAmount && receipt.debtAmount > 0) {
    rows.push({ kind: 'pair', label: 'Sisa Utang', value: money(receipt.debtAmount) });
  }
  rows.push({ kind: 'divider', text: divider('=') });

  if (receipt.status === 'VOID') {
    rows.push({ kind: 'center', text: '** TRANSAKSI DIBATALKAN **' });
    rows.push({ kind: 'divider', text: divider('=') });
  } else {
    rows.push({ kind: 'center', text: 'Terima kasih!' });
  }

  return rows;
}

/**
 * Render struk resmi (dari GET /orders/{id}/receipt) sebagai teks polos ala
 * thermal printer 58mm — dipakai untuk isi pesan tombol "Bagikan" (dan
 * dibangun dari data terstruktur yang sama dengan `buildReceiptRows`, jadi
 * kedua versi tidak pernah dobel-maintain atau saling berbeda).
 */
export function formatReceiptText(receipt: Receipt): string {
  return buildReceiptRows(receipt)
    .map((row) => {
      switch (row.kind) {
        case 'center':
          return center(row.text);
        case 'line':
        case 'divider':
          return row.text;
        case 'pair':
          return twoCol(row.label, row.value);
      }
    })
    .join('\n');
}
