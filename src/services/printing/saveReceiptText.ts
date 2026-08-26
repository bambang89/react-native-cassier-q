import { Share } from 'react-native';

import type { Receipt } from '@/types/models';
import { formatReceiptText } from '@/utils/receiptText';

/**
 * Buka share sheet OS (bawaan `react-native`, bukan expo-sharing) supaya
 * struk bisa disimpan — mis. "Save to Files" di iOS, atau app penyimpanan
 * (Drive/Files/dst) yang terdaftar sebagai share target di Android.
 */
export async function saveReceiptText(receipt: Receipt): Promise<void> {
  await Share.share(
    { message: formatReceiptText(receipt), title: 'Simpan Struk' },
    { dialogTitle: 'Simpan Struk' },
  );
}
