import type { Receipt } from '@/types/models';
import { buildReceiptRows } from '@/utils/receiptText';

import { printRawWithReconnect } from '../bluetooth/BluetoothPrinterManager';
import { buildReceiptCommands } from '../bluetooth/receiptCommands';
import { getPaperWidth, getPrinterConfig, PAPER_CHARS } from '../settings';
import type { ReceiptPrinter } from '../types';

export const thermalPrinter: ReceiptPrinter = {
  type: 'THERMAL',
  label: 'Thermal Printer (Bluetooth ESC/POS)',
  /** Prints the receipt on the paired thermal printer using the selected paper width. */
  async print(receipt: Receipt) {
    const config = await getPrinterConfig();
    if (!config || config.type !== 'THERMAL') {
      throw new Error('Belum ada Thermal Printer yang dipasangkan. Buka Pengaturan > Pilih Printer.');
    }
    const chars = PAPER_CHARS[await getPaperWidth()];
    const commands = buildReceiptCommands(buildReceiptRows(receipt, chars), chars);
    await printRawWithReconnect(config.deviceAddress, commands);
  },
};
