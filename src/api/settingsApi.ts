import { apiClient } from './client';
import type { CheckoutSettings, PaymentMethod } from '@/types/models';

export interface UpdateCheckoutSettingsPayload {
  enabledPaymentMethods: PaymentMethod[];
  defaultPaymentMethod: PaymentMethod;
  taxEnabled: boolean;
}

/** Accepted payment methods, default method and PPN of the active store. */
export async function fetchCheckoutSettings(): Promise<CheckoutSettings> {
  const { data } = await apiClient.get<CheckoutSettings>('/store/checkout-settings');
  return data;
}

/** Saves checkout settings (store owner only). */
export async function updateCheckoutSettings(payload: UpdateCheckoutSettingsPayload): Promise<CheckoutSettings> {
  const { data } = await apiClient.put<CheckoutSettings>('/store/checkout-settings', payload);
  return data;
}
