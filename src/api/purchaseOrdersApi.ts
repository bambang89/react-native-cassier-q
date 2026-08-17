import { apiClient } from './client';
import type { Page, PurchaseOrder } from '@/types/models';

export interface CreatePurchaseOrderItemPayload {
  productId: string;
  unitId: string;
  quantity: number;
  unitCost: number;
}

export interface CreatePurchaseOrderPayload {
  supplierId: string;
  /** Format YYYY-MM-DD. */
  expectedDate?: string;
  notes?: string;
  items: CreatePurchaseOrderItemPayload[];
}

export interface ReceiveItemPayload {
  purchaseOrderItemId: string;
  receivedQuantity: number;
}

export interface FetchPurchaseOrdersParams {
  page?: number;
  size?: number;
}

export async function fetchPurchaseOrders({
  page = 0,
  size = 20,
}: FetchPurchaseOrdersParams = {}): Promise<Page<PurchaseOrder>> {
  const { data } = await apiClient.get<Page<PurchaseOrder>>('/purchase-orders', { params: { page, size } });
  return data;
}

export async function fetchPurchaseOrder(id: string): Promise<PurchaseOrder> {
  const { data } = await apiClient.get<PurchaseOrder>(`/purchase-orders/${id}`);
  return data;
}

/** Status PO langsung ORDERED begitu dibuat — belum ada barang yang diterima. */
export async function createPurchaseOrder(payload: CreatePurchaseOrderPayload): Promise<PurchaseOrder> {
  const { data } = await apiClient.post<PurchaseOrder>('/purchase-orders', payload);
  return data;
}

/** Terima barang, boleh sebagian — backend yang nambah stok & catat stock_movements. */
export async function receivePurchaseOrder(id: string, items: ReceiveItemPayload[]): Promise<PurchaseOrder> {
  const { data } = await apiClient.post<PurchaseOrder>(`/purchase-orders/${id}/receive`, { items });
  return data;
}

/** Cuma bisa kalau belum ada barang yang diterima sama sekali. */
export async function cancelPurchaseOrder(id: string): Promise<PurchaseOrder> {
  const { data } = await apiClient.post<PurchaseOrder>(`/purchase-orders/${id}/cancel`);
  return data;
}
