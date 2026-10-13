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

/** Upload/ganti foto toko (khusus Kepala Toko). */
export async function uploadStoreLogo(file: { uri: string; name: string; type: string }): Promise<StoreProfile> {
  const formData = new FormData();
  formData.append('file', file as unknown as Blob);
  const { data } = await apiClient.post<StoreProfile>('/store/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/** Hapus foto toko (khusus Kepala Toko). */
export async function removeStoreLogo(): Promise<StoreProfile> {
  const { data } = await apiClient.delete<StoreProfile>('/store/logo');
  return data;
}
