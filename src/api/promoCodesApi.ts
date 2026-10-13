import { apiClient } from './client';
import type { PromoCode, PromoCodePayload, PromoQuote } from '@/types/models';

/** All promo codes of the store (owner only). */
export async function fetchPromoCodes(): Promise<PromoCode[]> {
  const { data } = await apiClient.get<PromoCode[]>('/promo-codes');
  return data;
}

export async function createPromoCode(payload: PromoCodePayload): Promise<PromoCode> {
  const { data } = await apiClient.post<PromoCode>('/promo-codes', payload);
  return data;
}

export async function updatePromoCode(id: string, payload: PromoCodePayload): Promise<PromoCode> {
  const { data } = await apiClient.put<PromoCode>(`/promo-codes/${id}`, payload);
  return data;
}

/** Deletes an unused code; a code already used in sales is deactivated instead. */
export async function deletePromoCode(id: string): Promise<void> {
  await apiClient.delete(`/promo-codes/${id}`);
}

/** Checks a code against the cart subtotal at checkout (any role). */
export async function validatePromoCode(code: string, subtotal: number): Promise<PromoQuote> {
  const { data } = await apiClient.post<PromoQuote>('/promo-codes/validate', { code, subtotal });
  return data;
}
