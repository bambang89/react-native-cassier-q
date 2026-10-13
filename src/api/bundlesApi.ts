import { apiClient } from './client';
import type { BundlePayload, Product } from '@/types/models';

// Paket bundling — every call is for the store head (Kepala Toko) only.

export async function fetchBundles(): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>('/bundles');
  return data;
}

export async function createBundle(payload: BundlePayload): Promise<Product> {
  const { data } = await apiClient.post<Product>('/bundles', payload);
  return data;
}

export async function updateBundle(id: string, payload: BundlePayload): Promise<Product> {
  const { data } = await apiClient.put<Product>(`/bundles/${id}`, payload);
  return data;
}

export async function deleteBundle(id: string): Promise<void> {
  await apiClient.delete(`/bundles/${id}`);
}
