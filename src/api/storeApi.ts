import { apiClient } from './client';
import type { StoreProfile } from '@/types/models';

export async function fetchStoreProfile(): Promise<StoreProfile> {
  const { data } = await apiClient.get<StoreProfile>('/store');
  return data;
}

export interface UpdateStoreProfilePayload {
  storeName?: string;
  address?: string;
  province?: string;
  city?: string;
  phone?: string;
  settings?: Record<string, string>;
}

/** Partial update — cuma field yang dikirim yang berubah. */
export async function updateStoreProfile(payload: UpdateStoreProfilePayload): Promise<StoreProfile> {
  const { data } = await apiClient.put<StoreProfile>('/store', payload);
  return data;
}
