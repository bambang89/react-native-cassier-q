export {
  connectBluetoothPrinter,
  disconnectBluetoothPrinter,
  scanBluetoothPrinters,
} from './bluetooth/BluetoothPrinterManager';
export { getPrinter } from './registry';
export { saveReceiptText } from './saveReceiptText';
export { clearPrinterConfig, getPrinterConfig, savePrinterConfig } from './settings';
export type { StoredPrinterConfig } from './settings';
export type { PrinterType, ReceiptPrinter } from './types';
