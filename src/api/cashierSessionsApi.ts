import { apiClient } from './client';
import type { CashierSession } from '../types/models';

export async function fetchCurrentSession(): Promise<CashierSession | null> {
  try {
    const { data } = await apiClient.get<CashierSession>('/cashier-sessions/current');
    return data;
  } catch (error: unknown) {
    if (isNotFound(error)) return null;
    throw error;
  }
}

function isNotFound(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'response' in error &&
    (error as { response?: { status?: number } }).response?.status === 404
  );
}

export async function openSession(openingCash: number): Promise<CashierSession> {
  const { data } = await apiClient.post<CashierSession>('/cashier-sessions/open', { openingCash });
  return data;
}

export async function closeSession(
  id: string,
  payload: { actualCash: number; notes?: string },
): Promise<CashierSession> {
  const { data } = await apiClient.post<CashierSession>(`/cashier-sessions/${id}/close`, payload);
  return data;
}
