import type { PrinterType, ReceiptPrinter } from './types';
import { dotMatrixPrinter } from './printers/dotMatrixPrinter';
import { labelPrinter } from './printers/labelPrinter';
import { systemPrinter } from './printers/systemPrinter';
import { thermalPrinter } from './printers/thermalPrinter';

const PRINTERS: Record<PrinterType, ReceiptPrinter> = {
  SYSTEM: systemPrinter,
  THERMAL: thermalPrinter,
  DOT_MATRIX: dotMatrixPrinter,
  LABEL: labelPrinter,
};

export function getPrinter(type: PrinterType): ReceiptPrinter {
  return PRINTERS[type];
}
