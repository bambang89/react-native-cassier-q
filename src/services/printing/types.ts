import type { Receipt } from '@/types/models';

export type PrinterType = 'SYSTEM' | 'THERMAL' | 'DOT_MATRIX' | 'LABEL';

export interface ReceiptPrinter {
  readonly type: PrinterType;
  /** Nama yang ditampilkan di UI (mis. pemilihan jenis printer). */
  readonly label: string;
  print(receipt: Receipt): Promise<void>;
}
