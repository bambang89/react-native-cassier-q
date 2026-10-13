import { Share } from 'react-native';

import type { Receipt } from '@/types/models';
import { formatReceiptText } from '@/utils/receiptText';

import { getPaperWidth, PAPER_CHARS } from '../settings';
import type { ReceiptPrinter } from '../types';

export const systemPrinter: ReceiptPrinter = {
  type: 'SYSTEM',
  label: 'Print System (via share sheet OS)',
  /** Fallback when no Bluetooth printer is set: opens the OS share sheet with the plain-text receipt. */
  async print(receipt: Receipt) {
    await Share.share(
      { message: formatReceiptText(receipt, PAPER_CHARS[await getPaperWidth()]), title: 'Cetak Struk' },
      { dialogTitle: 'Cetak Struk' },
    );
  },
};
