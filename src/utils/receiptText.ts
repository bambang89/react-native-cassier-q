import { PAYMENT_METHODS } from '@/types/models';
import type { Receipt } from '@/types/models';

// Lebar kolom ala kertas thermal 58mm (32 karakter font monospace) — dipakai
// juga buat versi teks yang di-share (WhatsApp dkk render monospace kalau
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

function paymentMethodLabel(method: string): string {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method;
}

/**
 * Render struk resmi (dari GET /orders/{id}/receipt) sebagai teks polos ala
 * thermal printer 58mm — dipakai untuk tampilan di layar (font monospace)
 * dan untuk isi pesan tombol "Bagikan".
 */
export function formatReceiptText(receipt: Receipt): string {
  const rows: string[] = [];

  rows.push(center(receipt.storeName ?? 'cassier-Q'));
  if (receipt.storeAddress) rows.push(center(receipt.storeAddress));
  if (receipt.storePhone) rows.push(center(receipt.storePhone));
  rows.push(divider('='));
  rows.push(`No: ${receipt.transactionNumber}`);
  rows.push(`Tgl: ${new Date(receipt.transactionDate).toLocaleString('id-ID')}`);
  rows.push(`Kasir: ${receipt.cashierName}`);
  if (receipt.customerName) rows.push(`Pelanggan: ${receipt.customerName}`);
  rows.push(divider('-'));

  for (const item of receipt.items) {
    rows.push(item.productName);
    rows.push(twoCol(`  ${item.quantity} ${item.unitName} x ${money(item.unitPrice)}`, money(item.subtotal)));
  }

  rows.push(divider('-'));
  rows.push(twoCol('Subtotal', money(receipt.subtotal)));
  if (receipt.discountAmount > 0) rows.push(twoCol('Diskon', `-${money(receipt.discountAmount)}`));
  if (receipt.taxAmount > 0) rows.push(twoCol('Pajak', money(receipt.taxAmount)));
  rows.push(twoCol('TOTAL', money(receipt.grandTotal)));
  rows.push(twoCol(`Bayar (${paymentMethodLabel(receipt.paymentMethod)})`, money(receipt.paymentAmount)));
  rows.push(twoCol('Kembalian', money(receipt.changeAmount)));

  if (receipt.debtAmount && receipt.debtAmount > 0) {
    rows.push(twoCol('Sisa Utang', money(receipt.debtAmount)));
  }
  rows.push(divider('='));

  if (receipt.status === 'VOID') {
    rows.push(center('** TRANSAKSI DIBATALKAN **'));
    rows.push(divider('='));
  } else {
    rows.push(center('Terima kasih!'));
  }

  return rows.join('\n');
}
