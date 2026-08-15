import { apiClient } from './client';
import type { SalesSummary } from '@/types/models';

export interface FetchSalesSummaryParams {
  from?: string;
  to?: string;
}

export async function fetchSalesSummary(params: FetchSalesSummaryParams = {}): Promise<SalesSummary> {
  const { data } = await apiClient.get<SalesSummary>('/reports/summary', { params });
  return data;
}
