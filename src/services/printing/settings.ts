import * as SecureStore from 'expo-secure-store';

import type { PrinterType } from './types';

const STORAGE_KEY = 'cassierq.printer.config';

export interface StoredPrinterConfig {
  type: Extract<PrinterType, 'THERMAL' | 'DOT_MATRIX'>;
  deviceName: string;
  deviceAddress: string;
}

/** Reads the saved printer (type, name, address); returns null if none or if the stored value is corrupt. */
export async function getPrinterConfig(): Promise<StoredPrinterConfig | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredPrinterConfig;
  } catch {
    return null;
  }
}

/** Persists the selected printer in secure storage. */
export async function savePrinterConfig(config: StoredPrinterConfig): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(config));
}

/** Removes the saved printer. */
export async function clearPrinterConfig(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}

const PAPER_WIDTH_KEY = 'cassierq.printer.paperWidth';

/** Receipt paper width in mm. 58mm = small thermal printers, 80mm = standard POS printers. */
export type PaperWidth = 58 | 80;

export const PAPER_WIDTHS: PaperWidth[] = [58, 80];

/** Characters per line (ESC/POS font A) for each paper width. */
export const PAPER_CHARS: Record<PaperWidth, 32 | 48> = { 58: 32, 80: 48 };

/** Reads the saved receipt paper width; defaults to 58mm. */
export async function getPaperWidth(): Promise<PaperWidth> {
  const raw = await SecureStore.getItemAsync(PAPER_WIDTH_KEY);
  return raw === '80' ? 80 : 58;
}

/** Persists the receipt paper width (58mm / 80mm). */
export async function savePaperWidth(width: PaperWidth): Promise<void> {
  await SecureStore.setItemAsync(PAPER_WIDTH_KEY, String(width));
}
