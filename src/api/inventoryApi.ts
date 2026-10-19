import { apiClient } from './client';
import type {
  BadStockItem,
  StockItem,
  BadStockReason,
  BadStockReport,
  BadStockStatus,
  OpnameResult,
  Page,
  StockMovementItem,
  StockSummary,
} from '@/types/models';

/** Stock of every product with status (habis/menipis/aman) and value at cost. */
export async function fetchStock(): Promise<StockSummary> {
  const { data } = await apiClient.get<StockSummary>('/inventory/stock');
  return data;
}

/** Sets a product's minimum stock in base units (0 = use the default threshold). */
export async function updateMinimumStock(productId: string, minimumStock: number): Promise<StockItem> {
  const { data } = await apiClient.put<StockItem>(`/inventory/stock/${productId}/minimum`, { minimumStock });
  return data;
}

/** Stock movement history, newest first. */
export async function fetchMovements(params: {
  productId?: string;
  type?: string;
  from?: string;
  to?: string;
  page?: number;
  size?: number;
}): Promise<Page<StockMovementItem>> {
  const { data } = await apiClient.get<Page<StockMovementItem>>('/inventory/movements', { params });
  return data;
}

/** Stock opname: sets each product to the counted quantity (base unit). */
export async function submitOpname(
  items: { productId: string; countedQuantity: number }[],
  notes?: string,
): Promise<OpnameResult> {
  const { data } = await apiClient.post<OpnameResult>('/inventory/opname', { items, notes });
  return data;
}

export async function fetchBadStock(status?: BadStockStatus): Promise<BadStockItem[]> {
  const { data } = await apiClient.get<BadStockItem[]>('/inventory/bad-stock', { params: { status } });
  return data;
}

export async function reportBadStock(payload: {
  productId: string;
  unitId: string;
  quantity: number;
  reason: BadStockReason;
  notes?: string;
}): Promise<BadStockItem> {
  const { data } = await apiClient.post<BadStockItem>('/inventory/bad-stock', payload);
  return data;
}

export async function uploadBadStockPhoto(
  id: string,
  file: { uri: string; name: string; type: string },
): Promise<BadStockItem> {
  const formData = new FormData();
  formData.append('file', file as unknown as Blob);
  const { data } = await apiClient.post<BadStockItem>(`/inventory/bad-stock/${id}/photo`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

/** approve (Kepala Toko), return / dispose (izin retur/musnahkan), cancel (Kepala Toko). */
export async function actOnBadStock(
  id: string,
  action: 'approve' | 'return' | 'dispose' | 'cancel',
  body: { supplierId?: string; note?: string } = {},
): Promise<BadStockItem> {
  const { data } = await apiClient.post<BadStockItem>(`/inventory/bad-stock/${id}/${action}`, body);
  return data;
}

export async function fetchBadStockReport(from: string, to: string): Promise<BadStockReport> {
  const { data } = await apiClient.get<BadStockReport>('/inventory/bad-stock/report', { params: { from, to } });
  return data;
}

export async function fetchBadStockSettings(): Promise<{ requireApproval: boolean }> {
  const { data } = await apiClient.get<{ requireApproval: boolean }>('/inventory/bad-stock/settings');
  return data;
}

export async function updateBadStockSettings(requireApproval: boolean): Promise<{ requireApproval: boolean }> {
  const { data } = await apiClient.put<{ requireApproval: boolean }>('/inventory/bad-stock/settings', { requireApproval });
  return data;
}
