import { ReceiptBuilder } from 'react-native-earl-thermal-printer';

import type { ReceiptRow } from '@/utils/receiptText';

export function buildReceiptCommands(rows: ReceiptRow[], paperWidth: 32 | 42 | 48 = 32): string {
  const builder = new ReceiptBuilder({ paperWidth });

  for (const row of rows) {
    switch (row.kind) {
      case 'center':
        builder.align('center').textLine(row.text).align('left');
        break;
      case 'line':
        builder.textLine(row.text);
        break;
      case 'divider':
        builder.divider(row.text.charAt(0) || '-', row.text.length);
        break;
      case 'pair':
        builder.keyValue(row.label, row.value);
        break;
    }
  }

  return builder.feed(2).cut().build();
}
