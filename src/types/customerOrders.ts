/** Pesanan pelanggan (toko online) — sama dengan cassier-q-web src/types/storefront.ts. */
export type CustomerOrderStatus = 'NEW' | 'ACCEPTED' | 'IN_PROGRESS' | 'READY' | 'COMPLETED' | 'CANCELLED';
export type Fulfillment = 'PICKUP' | 'DELIVERY' | 'DINE_IN' | 'TAKEAWAY';

export interface CustomerOrderItem {
  id: string;
  productId: string;
  unitId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes: string | null;
}

export interface CustomerOrder {
  id: string;
  orderNumber: string;
  source: 'ONLINE' | 'POS';
  status: CustomerOrderStatus;
  fulfillment: Fulfillment;
  customerName: string;
  customerPhone: string | null;
  customerId: string | null;
  tableLabel: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  subtotal: number;
  salesTransactionId: string | null;
  createdAt: string;
  updatedAt: string;
  items: CustomerOrderItem[];
}

export interface OrderCounts {
  newCount: number;
  acceptedCount: number;
  inProgressCount: number;
  readyCount: number;
}

export interface PublicOrderStatus {
  id: string;
  orderNumber: string;
  status: CustomerOrderStatus;
  fulfillment: Fulfillment;
  subtotal: number;
  createdAt: string;
  items: CustomerOrderItem[];
}

export interface PublicOrderRequest {
  customerName: string;
  customerPhone?: string;
  fulfillment: Fulfillment;
  tableLabel?: string;
  deliveryAddress?: string;
  notes?: string;
  items: { productId: string; quantity: number; notes?: string }[];
}
