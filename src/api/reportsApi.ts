import { apiClient } from './client';
import type { SalesSummary } from '@/types/models';

export interface FetchSalesSummaryParams {
  from?: string;
  to?: string;
  /** Jumlah produk terlaris (default 5, maks 20). */
  top?: number;
}

export async function fetchSalesSummary(params: FetchSalesSummaryParams = {}): Promise<SalesSummary> {
  const { data } = await apiClient.get<SalesSummary>('/reports/summary', { params });
  return data;
}
