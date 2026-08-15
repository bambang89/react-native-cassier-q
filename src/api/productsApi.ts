import { apiClient } from './client';
import type { Page, Product, Stock } from '../types/models';

export interface FetchProductsParams {
  search?: string;
  page?: number;
  size?: number;
}

export async function fetchProducts({ search, page = 0, size = 50 }: FetchProductsParams = {}): Promise<
  Page<Product>
> {
  const { data } = await apiClient.get<Page<Product>>('/products', {
    params: { search: search || undefined, page, size },
  });
  return data;
}

export async function fetchProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    const { data } = await apiClient.get<Product>(`/products/barcode/${encodeURIComponent(barcode)}`);
    return data;
  } catch (error: unknown) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

function isNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && 'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 404;
}

export interface ProductPayload {
  sku: string;
  barcode?: string;
  productName: string;
  categoryId: string;
  brand?: string;
  description?: string;
  baseUnitId: string;
  sellingPrice: number;
  costPrice?: number;
}

export async function createProduct(payload: ProductPayload): Promise<Product> {
  const { data } = await apiClient.post<Product>('/products', payload);
  return data;
}

export async function updateProduct(id: string, payload: ProductPayload): Promise<Product> {
  const { data } = await apiClient.put<Product>(`/products/${id}`, payload);
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  await apiClient.delete(`/products/${id}`);
}

export interface RestockPayload {
  unitId: string;
  quantity: number;
  notes?: string;
}

export async function restockProduct(id: string, payload: RestockPayload): Promise<Stock> {
  const { data } = await apiClient.post<Stock>(`/products/${id}/restock`, payload);
  return data;
}
