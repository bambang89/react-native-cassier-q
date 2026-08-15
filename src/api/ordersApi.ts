import { apiClient } from './client';
import type { CartItem, Order, Page, PaymentMethod, Receipt } from '@/types/models';

export interface CreateOrderPayload {
  paymentMethod: PaymentMethod;
  paymentAmount: number;
  discountAmount?: number;
  taxAmount?: number;
}

export async function createOrder(items: CartItem[], payload: CreateOrderPayload): Promise<Order> {
  const { data } = await apiClient.post<Order>('/orders', {
    items: items.map((item) => ({
      productId: item.product.id,
      unitId: item.unitId,
      quantity: item.quantity,
    })),
    ...payload,
  });
  return data;
}

export interface FetchOrdersParams {
  page?: number;
  size?: number;
}

export async function fetchOrders({ page = 0, size = 20 }: FetchOrdersParams = {}): Promise<Page<Order>> {
  const { data } = await apiClient.get<Page<Order>>('/orders', { params: { page, size } });
  return data;
}

export async function fetchOrder(id: string): Promise<Order> {
  const { data } = await apiClient.get<Order>(`/orders/${id}`);
  return data;
}

export async function voidOrder(id: string, reason: string): Promise<Order> {
  const { data } = await apiClient.post<Order>(`/orders/${id}/void`, { reason });
  return data;
}

/** Data struk resmi (nama toko, metode bayar, status utang) — buat dicetak/dibagikan. */
export async function fetchReceipt(id: string): Promise<Receipt> {
  const { data } = await apiClient.get<Receipt>(`/orders/${id}/receipt`);
  return data;
}
