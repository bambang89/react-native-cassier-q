import { apiClient } from './client';
import type { Page, Product, ProductPhoto, ProductUnit, Stock } from '@/types/models';

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
  imageUrl?: string;
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

export interface ProductPhotoFile {
  uri: string;
  name: string;
  type: string;
}

/** Upload/ganti foto produk (JPG/PNG/WEBP, maks 5MB) — balikan produk lengkap dgn imageUrl baru. */
export async function uploadProductPhoto(id: string, file: ProductPhotoFile): Promise<Product> {
  const formData = new FormData();
  formData.append('file', file as unknown as Blob);
  const { data } = await apiClient.post<Product>(`/products/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/** Daftar foto galeri produk (di luar foto utama/imageUrl). */
export async function fetchProductPhotos(productId: string): Promise<ProductPhoto[]> {
  const { data } = await apiClient.get<ProductPhoto[]>(`/products/${productId}/photos`);
  return data;
}

/** Tambah 1 foto ke galeri produk (JPG/PNG/WEBP, maks 5MB). */
export async function addProductPhoto(productId: string, file: ProductPhotoFile): Promise<ProductPhoto> {
  const formData = new FormData();
  formData.append('file', file as unknown as Blob);
  const { data } = await apiClient.post<ProductPhoto>(`/products/${productId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deleteProductPhoto(productId: string, photoId: string): Promise<void> {
  await apiClient.delete(`/products/${productId}/photos/${photoId}`);
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

/** Daftar satuan berlaku (dasar + alternatif) utk 1 produk. */
export async function fetchProductUnits(productId: string): Promise<ProductUnit[]> {
  const { data } = await apiClient.get<ProductUnit[]>(`/products/${productId}/units`);
  return data;
}

export interface RegisterProductUnitPayload {
  unitId: string;
  conversionToBase: number;
  purchaseUnit?: boolean;
  saleUnit?: boolean;
}

/** Daftarkan satuan alternatif + rasio konversinya (pasangan tulis dari /convert). */
export async function registerProductUnit(
  productId: string,
  payload: RegisterProductUnitPayload,
): Promise<ProductUnit> {
  const { data } = await apiClient.post<ProductUnit>(`/products/${productId}/units`, payload);
  return data;
}
