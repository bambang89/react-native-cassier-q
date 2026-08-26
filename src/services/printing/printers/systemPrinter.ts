import { Share } from 'react-native';

import type { Receipt } from '@/types/models';
import { formatReceiptText } from '@/utils/receiptText';

import type { ReceiptPrinter } from '../types';

export const systemPrinter: ReceiptPrinter = {
  type: 'SYSTEM',
  label: 'Print System (via share sheet OS)',
  async print(receipt: Receipt) {
    await Share.share(
      { message: formatReceiptText(receipt), title: 'Cetak Struk' },
      { dialogTitle: 'Cetak Struk' },
    );
  },
};
