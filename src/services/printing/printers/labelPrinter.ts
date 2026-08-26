import type { ReceiptPrinter } from '../types';

export const labelPrinter: ReceiptPrinter = {
  type: 'LABEL',
  label: 'Printer Label (Bluetooth ZPL/TSPL)',
  async print() {
    throw new Error('Cetak ke Printer Label belum tersedia. Gunakan Print System untuk saat ini.');
  },
};
