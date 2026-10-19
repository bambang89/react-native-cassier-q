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
  /** Foto profil (hanya bisa diatur akun Kepala Toko). */
  avatarUrl?: string | null;
};

export type AuthResponse = {
  accessToken: string;
  refreshToken: string;
  /** Waktu kedaluwarsa access token, epoch millis (dari server). */
  expiresAt: number;
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
  imageUrl: string | null;
  baseUnitId: string;
  baseUnitName: string;
  status: ProductStatus;
  sellingPrice: number;
  costPrice: number | null;
  /** Stok di toko user yang sedang login, dalam base unit. Untuk paket: jumlah paket yang bisa dibuat dari stok isinya. */
  stockQuantity: number;
  /** SINGLE = produk biasa; BUNDLE = paket bundling (stok mengikuti isinya). */
  productType?: 'SINGLE' | 'BUNDLE';
  bundleItems?: BundleItem[] | null;
  /** Harga grosir bertingkat per satuan dasar di toko ini (kosong = tanpa harga grosir). */
  priceTiers?: PriceTier[] | null;
  /** Minimum stok di toko ini (0 = belum diatur); null untuk paket. */
  minimumStock?: number | null;
  /** Ambang "menipis" yang berlaku: minimum stok produk, atau default backend bila belum diatur. */
  lowStockThreshold?: number | null;
};

/** Mulai `minQuantity` satuan dasar (total di satu transaksi), harga per satuan dasar = `unitPrice`. */
export type PriceTier = { minQuantity: number; unitPrice: number };

/** Satu isi paket bundling. */
export type BundleItem = {
  productId: string;
  productName: string;
  unitId: string;
  unitName: string;
  quantity: number;
  /** Jumlah per paket dalam satuan dasar produk isi. */
  quantityBase: number;
  /** Stok produk isi di toko ini (satuan dasar). */
  stockBase: number;
};

export type BundlePayload = {
  sku: string;
  barcode?: string;
  productName: string;
  categoryId: string;
  description?: string;
  imageUrl?: string;
  sellingPrice: number;
  items: { productId: string; unitId: string; quantity: number }[];
};

/** Hasil konversi jumlah dari satuan lain ke satuan dasar produk (GET /products/{id}/convert). */
export type UnitConversion = {
  productId: string;
  fromUnitId: string;
  fromUnitName: string;
  quantity: number;
  baseUnitId: string;
  baseUnitName: string;
  conversionToBase: number;
  quantityBaseUnit: number;
};

/** Satuan yang berlaku utk 1 produk (dasar + alternatif), dari GET/POST /products/{id}/units. */
export type ProductUnit = {
  unitId: string;
  unitName: string;
  conversionToBase: number;
  baseUnit: boolean;
  purchaseUnit: boolean;
  saleUnit: boolean;
};

/** Foto galeri produk (di luar `Product.imageUrl`), dari GET/POST /products/{id}/photos. */
export type ProductPhoto = {
  id: string;
  imageUrl: string;
  sortOrder: number;
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

/** Satuan produk (pcs, dus, kg, ...) — katalog global, bukan per-toko. */
export type Unit = {
  id: string;
  unitCode: string;
  unitName: string;
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
  /** Diisi kalau transaksi dijual ke pelanggan terdaftar (fitur hutang/piutang). */
  customerId: string | null;
  /** Sisa yang belum dibayar, kalau transaksi ini sebagian/seluruhnya kredit. */
  debtAmount: number | null;
  /** Kode promo yang dipakai; potongannya sudah termasuk di discountAmount. */
  promoCode?: string | null;
  promoDiscountAmount?: number | null;
};

// --- Pengaturan checkout & kode promo -------------------------------------

export type PaymentMethodSetting = { code: PaymentMethod; label: string; enabled: boolean };

/** GET /store/checkout-settings — metode bayar yang diterima toko + PPN. */
export type CheckoutSettings = {
  paymentMethods: PaymentMethodSetting[];
  defaultPaymentMethod: PaymentMethod;
  taxEnabled: boolean;
  taxRatePercent: number;
};

export type PromoDiscountType = 'PERCENT' | 'AMOUNT';

export type PromoCode = {
  id: string;
  code: string;
  name: string;
  discountType: PromoDiscountType;
  discountValue: number;
  maxDiscountAmount: number | null;
  minPurchaseAmount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usedCount: number;
  active: boolean;
};

export type PromoCodePayload = Omit<PromoCode, 'id' | 'usedCount'>;

/** POST /promo-codes/validate — hasil cek kode promo terhadap subtotal keranjang. */
export type PromoQuote = { code: string; name: string; description: string; discountAmount: number };

/** Data resmi struk dari backend (GET /orders/{id}/receipt) — sudah termasuk
 * profil toko & metode pembayaran, jadi lebih lengkap daripada OrderResponse. */
export type ReceiptItem = {
  productName: string;
  quantity: number;
  unitName: string;
  unitPrice: number;
  subtotal: number;
};

export type Receipt = {
  orderId: string;
  transactionNumber: string;
  transactionDate: string;
  status: OrderStatus;
  storeName: string | null;
  storeAddress: string | null;
  storePhone: string | null;
  cashierName: string;
  items: ReceiptItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  grandTotal: number;
  paymentMethod: PaymentMethod | string;
  paymentAmount: number;
  changeAmount: number;
  customerName: string | null;
  debtAmount: number | null;
};

/** Keranjang lokal sebelum dikirim ke POST /orders. */
export type CartItem = {
  product: Product;
  unitId: string;
  unitName: string;
  unitConversionToBase: number;
  quantity: number;
};

// --- Pelanggan & hutang/piutang --------------------------------------------

export type Customer = {
  id: string;
  customerCode: string;
  name: string;
  phone: string | null;
  address: string | null;
  creditLimit: number;
  active: boolean;
  balance: number;
};

/** Satu baris riwayat hutang/pembayaran (GET /customers/{id}/ledger). */
export type LedgerEntry = {
  id: string;
  entryType: string;
  amount: number;
  salesTransactionId: string | null;
  salesTransactionNumber: string | null;
  notes: string | null;
  createdByName: string | null;
  createdAt: string;
};

// --- Supplier & Purchase Order ----------------------------------------------

export type Supplier = {
  id: string;
  supplierCode: string;
  supplierName: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  active: boolean;
};

/** String bebas dari backend (mis. ORDERED/PARTIALLY_RECEIVED/RECEIVED/CANCELLED) — ditampilkan lewat pemetaan label. */
export type PurchaseOrderStatus = 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED' | string;

export type PurchaseOrderItem = {
  id: string;
  productId: string;
  productName: string;
  unitId: string;
  unitName: string;
  quantity: number;
  quantityBaseUnit: number;
  unitCost: number;
  receivedQuantityBaseUnit: number;
  subtotal: number;
};

export type PurchaseOrder = {
  id: string;
  poNumber: string;
  storeId: string;
  supplierId: string;
  supplierName: string;
  orderDate: string;
  expectedDate: string | null;
  status: PurchaseOrderStatus;
  notes: string | null;
  totalCost: number;
  items: PurchaseOrderItem[];
};

// --- Karyawan & Role ---------------------------------------------------------

export type Employee = {
  employeeId: string;
  userId: string;
  employeeCode: string;
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  active: boolean;
  roles: string[];
  /** NIK KTP (16 angka), opsional. */
  nationalId?: string | null;
  /** NIK / nomor induk karyawan, opsional. */
  employeeNumber?: string | null;
  photoUrl?: string | null;
};

export type Role = {
  id: string;
  roleCode: string;
  roleName: string;
  description: string | null;
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

// --- Store profile -----------------------------------------------------

export type StoreProfile = {
  id: string;
  storeCode: string;
  storeName: string;
  address: string | null;
  province: string | null;
  city: string | null;
  phone: string | null;
  status: string;
  headOffice: boolean;
  settings: Record<string, string>;
  /** Foto toko (settings LOGO_URL), URL lengkap. */
  logoUrl?: string | null;
};

// --- Pagination --------------------------------------------------------

export type Page<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
};

// --- Inventori ---------------------------------------------------------

export type StockStatus = 'OUT' | 'LOW' | 'OK';

export type StockItem = {
  productId: string;
  sku: string;
  productName: string;
  categoryName: string;
  baseUnitName: string;
  imageUrl: string | null;
  stock: number;
  minimumStock: number;
  costPrice: number | null;
  /** stok × harga modal */
  stockValue: number | null;
  status: StockStatus;
};

export type StockSummary = {
  products: number;
  outOfStock: number;
  lowStock: number;
  totalValue: number;
  items: StockItem[];
};

export type StockMovementItem = {
  id: string;
  createdAt: string;
  productId: string;
  productName: string;
  movementType: string;
  quantity: number;
  unitName: string;
  quantityBase: number;
  stockBefore: number;
  stockAfter: number;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  createdBy: string | null;
};

export type OpnameResult = {
  lines: {
    productId: string;
    productName: string;
    systemQuantity: number;
    countedQuantity: number;
    difference: number;
    differenceValue: number;
  }[];
  totalDifferenceValue: number;
};

export type BadStockReason = 'DAMAGED' | 'EXPIRED' | 'LOST' | 'DEFECT' | 'CUSTOMER_RETURN';
export type BadStockStatus = 'PENDING' | 'QUARANTINED' | 'RETURNED' | 'DISPOSED' | 'CANCELLED';

export type BadStockItem = {
  id: string;
  createdAt: string;
  productId: string;
  productName: string;
  quantity: number;
  unitName: string;
  quantityBase: number;
  reason: BadStockReason;
  notes: string | null;
  photoUrl: string | null;
  status: BadStockStatus;
  costValue: number | null;
  stockDeducted: boolean;
  reportedBy: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  supplierName: string | null;
  resolutionNote: string | null;
};

export type BadStockReport = {
  totalValue: number;
  records: number;
  byReason: { reason: BadStockReason; count: number; value: number }[];
  topProducts: { productId: string; productName: string; quantityBase: number; value: number }[];
  pending: number;
};
