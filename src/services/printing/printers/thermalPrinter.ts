import { BLEPrinter } from 'react-native-earl-thermal-printer';

import type { Receipt } from '@/types/models';
import { buildReceiptRows } from '@/utils/receiptText';

import { ensureConnected } from '../bluetooth/BluetoothPrinterManager';
import { buildReceiptCommands } from '../bluetooth/receiptCommands';
import { getPrinterConfig } from '../settings';
import type { ReceiptPrinter } from '../types';

export const thermalPrinter: ReceiptPrinter = {
  type: 'THERMAL',
  label: 'Thermal Printer (Bluetooth ESC/POS)',
  async print(receipt: Receipt) {
    const config = await getPrinterConfig();
    if (!config || config.type !== 'THERMAL') {
      throw new Error('Belum ada Thermal Printer yang dipasangkan. Buka Pengaturan > Pilih Printer.');
    }
    await ensureConnected(config.deviceAddress);
    const commands = buildReceiptCommands(buildReceiptRows(receipt));
    await BLEPrinter.printRawData(commands);
  },
};
