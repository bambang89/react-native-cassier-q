import * as SecureStore from 'expo-secure-store';

import type { PrinterType } from './types';

const STORAGE_KEY = 'cassierq.printer.config';

export interface StoredPrinterConfig {
  type: Extract<PrinterType, 'THERMAL' | 'DOT_MATRIX'>;
  deviceName: string;
  deviceAddress: string;
}

export async function getPrinterConfig(): Promise<StoredPrinterConfig | null> {
  const raw = await SecureStore.getItemAsync(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredPrinterConfig;
  } catch {
    return null;
  }
}

export async function savePrinterConfig(config: StoredPrinterConfig): Promise<void> {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(config));
}

export async function clearPrinterConfig(): Promise<void> {
  await SecureStore.deleteItemAsync(STORAGE_KEY);
}
