export type User = {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'cashier';
};

export type Product = {
  id: string;
  sku: string;
  barcode: string | null;
  name: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
};

export type CartItem = {
  product: Product;
  quantity: number;
};

export type OrderStatus = 'paid' | 'cancelled' | 'refunded';

export type Order = {
  id: string;
  createdAt: string;
  total: number;
  status: OrderStatus;
  items: CartItem[];
};
