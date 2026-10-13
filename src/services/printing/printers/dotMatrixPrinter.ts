import type { Receipt } from '@/types/models';
import { buildReceiptRows } from '@/utils/receiptText';

import { printRawWithReconnect } from '../bluetooth/BluetoothPrinterManager';
import { buildReceiptCommands } from '../bluetooth/receiptCommands';
import { getPaperWidth, getPrinterConfig, PAPER_CHARS } from '../settings';
import type { ReceiptPrinter } from '../types';

export const dotMatrixPrinter: ReceiptPrinter = {
  type: 'DOT_MATRIX',
  label: 'Dot Matrix / Impact Printer (Bluetooth ESC/POS)',
  /** Prints the receipt on the paired dot-matrix printer using the selected paper width. */
  async print(receipt: Receipt) {
    const config = await getPrinterConfig();
    if (!config || config.type !== 'DOT_MATRIX') {
      throw new Error('Belum ada Dot Matrix/Impact Printer yang dipasangkan. Buka Pengaturan > Pilih Printer.');
    }
    const chars = PAPER_CHARS[await getPaperWidth()];
    const commands = buildReceiptCommands(buildReceiptRows(receipt, chars), chars);
    await printRawWithReconnect(config.deviceAddress, commands);
  },
};
