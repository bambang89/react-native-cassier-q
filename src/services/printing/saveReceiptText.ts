import { Share } from 'react-native';

import type { Receipt } from '@/types/models';
import { formatReceiptText } from '@/utils/receiptText';

import { getPaperWidth, PAPER_CHARS } from './settings';

/**
 * Opens the OS share sheet (built-in `react-native`, not expo-sharing) so the receipt can be saved,
 * e.g. "Save to Files" on iOS or a storage app (Drive/Files) registered as a share target on Android.
 * The text is formatted for the selected paper width.
 */
export async function saveReceiptText(receipt: Receipt): Promise<void> {
  await Share.share(
    { message: formatReceiptText(receipt, PAPER_CHARS[await getPaperWidth()]), title: 'Simpan Struk' },
    { dialogTitle: 'Simpan Struk' },
  );
}
