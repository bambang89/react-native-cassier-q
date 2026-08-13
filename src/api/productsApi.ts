import { apiClient } from './client';
import type { Product } from '../types/models';

export async function fetchProducts(): Promise<Product[]> {
  const { data } = await apiClient.get<Product[]>('/products');
  return data;
}

export async function fetchProductByBarcode(barcode: string): Promise<Product | null> {
  const { data } = await apiClient.get<Product[]>('/products', { params: { barcode } });
  return data[0] ?? null;
}
