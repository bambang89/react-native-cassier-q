export {
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
  scanBluetoothPrinters,
} from './bluetooth/BluetoothPrinterManager';
export { getPrinter } from './registry';
export { saveReceiptText } from './saveReceiptText';
export {
  clearPrinterConfig,
  getPaperWidth,
  getPrinterConfig,
  PAPER_CHARS,
  PAPER_WIDTHS,
  savePaperWidth,
  savePrinterConfig,
} from './settings';
export type { PaperWidth, StoredPrinterConfig } from './settings';
export type { PrinterType, ReceiptPrinter } from './types';
