import { apiClient } from './client';
import type { Page } from '@/types/models';
import type { CustomerOrder, CustomerOrderStatus, OrderCounts } from '@/types/customerOrders';

/** status: ACTIVE (default) | DONE | satu status. */
export async function fetchCustomerOrders(status = 'ACTIVE', page = 0, size = 50): Promise<Page<CustomerOrder>> {
  const { data } = await apiClient.get<Page<CustomerOrder>>('/customer-orders', { params: { status, page, size } });
  return data;
}

export async function fetchOrderCounts(): Promise<OrderCounts> {
  const { data } = await apiClient.get<OrderCounts>('/customer-orders/counts');
  return data;
}

export async function changeOrderStatus(id: string, status: CustomerOrderStatus): Promise<CustomerOrder> {
  const { data } = await apiClient.post<CustomerOrder>(`/customer-orders/${id}/status`, { status });
  return data;
}

export async function markOrderPaid(id: string, salesTransactionId: string): Promise<CustomerOrder> {
  const { data } = await apiClient.post<CustomerOrder>(`/customer-orders/${id}/paid`, { salesTransactionId });
  return data;
}
