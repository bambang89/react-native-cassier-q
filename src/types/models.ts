// Bentuk-bentuk ini mengikuti persis skema OpenAPI backend cassier-Q
// (GET /v3/api-docs saat backend jalan). Kalau backend berubah, cek ulang
// dokumen itu dan sesuaikan di sini — jangan menebak nama field.

// --- Auth --------------------------------------------------------------

export type RoleAssignment = {
  roleCode: string;
  roleName: string;
  storeId: string | null;
  storeName: string | null;
};

export type User = {
  id: string;
  username: string;
  name: string;
  email: string;
  superadmin: boolean;
  roles: RoleAssignment[];
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
  user: User;
};

// --- Categories ----------------------------------------------------------

export type Category = {
  id: string;
  categoryCode: string;
  categoryName: string;
  parentCategoryId: string | null;
  parentCategoryName: string | null;
  active: boolean;
};

// --- Products & stok -----------------------------------------------------

/** Status siklus hidup produk, dikembalikan backend sebagai string bebas. */
export type ProductStatus = 'ACTIVE' | 'INACTIVE' | string;

export type Product = {
  id: string;
  sku: string;
  barcode: string | null;
  productName: string;
  categoryId: string;
  categoryName: string;
  brand: string | null;
  description: string | null;
  baseUnitId: string;
  baseUnitName: string;
  status: ProductStatus;
  sellingPrice: number;
  costPrice: number | null;
  /** Stok di toko user yang sedang login, dalam base unit. */
  stockQuantity: number;
};

export type Stock = {
  productId: string;
  productName: string;
  storeId: string;
  quantityBaseUnit: number;
  minimumStock: number | null;
  maximumStock: number | null;
  updatedAt: string;
};

// --- Orders (sales_transactions) -----------------------------------------

export type PaymentMethod = 'CASH' | 'CREDIT_CARD' | 'DEBIT' | 'TRANSFER' | 'QRIS';

export const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
  { value: 'CASH', label: 'Tunai' },
  { value: 'QRIS', label: 'QRIS' },
  { value: 'DEBIT', label: 'Kartu Debit' },
  { value: 'CREDIT_CARD', label: 'Kartu Kredit' },
  { value: 'TRANSFER', label: 'Transfer' },
];

/** Status transaksi, dikembalikan backend sebagai string bebas (mis. PAID/VOID). */
export type OrderStatus = 'PAID' | 'VOID' | string;

export type OrderItem = {
  productId: string;
  productName: string;
  unitId: string;
  unitName: string;
  quantity: number;
  quantityBaseUnit: number;
  unitPrice: number;
  discount: number;
  subtotal: number;
};

export type Order = {
  id: string;
  transactionNumber: string;
  storeId: string;
  cashierId: string;
  cashierName: string;
  transactionDate: string;
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paymentAmount: number;
  changeAmount: number;
  status: OrderStatus;
  voidReason: string | null;
  items: OrderItem[];
};

/** Keranjang lokal sebelum dikirim ke POST /orders. */
export type CartItem = {
  product: Product;
  /** Default = product.baseUnitId — backend belum punya endpoint konversi unit. */
  unitId: string;
  quantity: number;
};

// --- Cashier sessions ------------------------------------------------------

export type CashierSessionStatus = 'OPEN' | 'CLOSED' | string;

export type CashierSession = {
  id: string;
  storeId: string;
  cashierId: string;
  cashierName: string;
  openedAt: string;
  closedAt: string | null;
  openingCash: number;
  expectedCash: number | null;
  actualCash: number | null;
  cashDifference: number | null;
  status: CashierSessionStatus;
  notes: string | null;
};

// --- Reports ---------------------------------------------------------------

export type BestSellerItem = {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalRevenue: number;
};

export type SalesSummary = {
  from: string;
  to: string;
  orderCount: number;
  grossSales: number;
  topSellers: BestSellerItem[];
};

// --- Pagination --------------------------------------------------------

export type Page<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};
