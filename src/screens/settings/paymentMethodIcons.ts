import {
  BarcodeIcon,
  CreditCardIcon,
  ReceiveIcon,
  WalletIcon,
} from '@/components/icons/LineIcons';
import type { PaymentMethod } from '@/types/models';

/** Icon per payment method, shared by checkout and the payment settings. */
export const PAYMENT_METHOD_ICONS: Record<PaymentMethod, typeof CreditCardIcon> = {
  CASH: WalletIcon,
  QRIS: BarcodeIcon,
  DEBIT: CreditCardIcon,
  CREDIT_CARD: CreditCardIcon,
  TRANSFER: ReceiveIcon,
};
