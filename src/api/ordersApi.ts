import { apiClient } from './client';
import type { CartItem, Order } from '../types/models';

export async function createOrder(items: CartItem[]): Promise<Order> {
  const { data } = await apiClient.post<Order>('/orders', {
    items: items.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
  });
  return data;
}

export async function fetchOrders(): Promise<Order[]> {
  const { data } = await apiClient.get<Order[]>('/orders');
  return data;
}
