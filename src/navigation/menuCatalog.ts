import type { ComponentType } from 'react';

import { useAppSelector } from '@/store/hooks';
import { colors } from '@/theme';
import {
  BarChartIcon,
  BoxIcon,
  CartIcon,
  ClipboardIcon,
  DashboardIcon,
  EmployeeIcon,
  FolderIcon,
  LayersIcon,
  PeopleIcon,
  PlugIcon,
  PrintIcon,
  ReceiptIcon,
  ScaleIcon,
  StoreIcon,
  TruckIcon,
  WalletIcon,
} from '@/components/icons/LineIcons';
import type { LineIconProps } from '@/components/icons/LineIcons';
import type { MainTabParamList, RootStackParamList } from './types';

/**
 * Katalog menu app — satu sumber untuk bottom tab bar, layar Menu, sidebar
 * tablet, dan layar "Hak Akses Menu" Kepala Toko. Key sama dengan
 * MenuAccessService.MENUS di backend.
 */
export type MenuKey =
  | 'dashboard'
  | 'pos'
  | 'orders'
  | 'pesanan'
  | 'products'
  | 'categories'
  | 'units'
  | 'inventory'
  | 'customers'
  | 'expenses'
  | 'reports'
  | 'suppliers'
  | 'purchase_orders'
  | 'employees'
  | 'outlet'
  | 'integrations'
  | 'printer';

export type MenuTarget =
  | { tab: keyof MainTabParamList }
  | { stack: Exclude<keyof RootStackParamList, 'Auth' | 'Main'> };

export type MenuEntry = {
  key: MenuKey;
  label: string;
  hint: string;
  icon: ComponentType<LineIconProps>;
  tint: string;
  tintBg: string;
  target: MenuTarget;
};

const blue = { tint: colors.primary[600], tintBg: colors.primary[50] };
const teal = { tint: colors.teal[700], tintBg: colors.teal[50] };
const green = { tint: colors.success[600], tintBg: colors.success[50] };
const amber = { tint: colors.warning[600], tintBg: colors.warning[50] };
const gray = { tint: colors.gray[700], tintBg: colors.gray[100] };

export const MENU_CATALOG: Record<MenuKey, MenuEntry> = {
  dashboard: { key: 'dashboard', label: 'Beranda', hint: 'Ringkasan penjualan hari ini', icon: DashboardIcon, ...blue, target: { tab: 'Dashboard' } },
  pos: { key: 'pos', label: 'Kasir', hint: 'Catat penjualan', icon: CartIcon, ...blue, target: { tab: 'POS' } },
  orders: { key: 'orders', label: 'Transaksi', hint: 'Riwayat & void transaksi', icon: ReceiptIcon, ...teal, target: { tab: 'Orders' } },
  pesanan: { key: 'pesanan', label: 'Pesanan', hint: 'Antrian pesanan masuk', icon: ClipboardIcon, ...blue, target: { tab: 'Pesanan' } },
  products: { key: 'products', label: 'Produk', hint: 'Katalog, harga & stok', icon: BoxIcon, ...green, target: { tab: 'Products' } },
  categories: { key: 'categories', label: 'Kategori', hint: 'Kelompok produk', icon: FolderIcon, ...amber, target: { stack: 'Categories' } },
  units: { key: 'units', label: 'Satuan', hint: 'Pcs, dus, kg, ...', icon: ScaleIcon, ...blue, target: { stack: 'Units' } },
  inventory: { key: 'inventory', label: 'Inventori', hint: 'Stok & mutasi gudang', icon: LayersIcon, ...teal, target: { tab: 'Inventory' } },
  customers: { key: 'customers', label: 'Pelanggan', hint: 'Data & utang pelanggan', icon: PeopleIcon, ...green, target: { tab: 'Customers' } },
  expenses: { key: 'expenses', label: 'Pengeluaran', hint: 'Biaya operasional', icon: WalletIcon, ...amber, target: { tab: 'Expenses' } },
  reports: { key: 'reports', label: 'Laporan', hint: 'Penjualan & produk terlaris', icon: BarChartIcon, ...blue, target: { tab: 'Reports' } },
  suppliers: { key: 'suppliers', label: 'Supplier', hint: 'Pemasok barang', icon: TruckIcon, ...teal, target: { stack: 'Suppliers' } },
  purchase_orders: { key: 'purchase_orders', label: 'Purchase Order', hint: 'Pembelian ke supplier', icon: ReceiptIcon, ...green, target: { stack: 'PurchaseOrders' } },
  employees: { key: 'employees', label: 'Karyawan', hint: 'Tim & hak akses', icon: EmployeeIcon, ...teal, target: { tab: 'Employees' } },
  outlet: { key: 'outlet', label: 'Outlet', hint: 'Profil & data toko', icon: StoreIcon, ...green, target: { tab: 'StoreProfile' } },
  integrations: { key: 'integrations', label: 'Integrasi', hint: 'Layanan pihak ketiga', icon: PlugIcon, ...amber, target: { tab: 'Integrations' } },
  printer: { key: 'printer', label: 'Printer Struk', hint: 'Bluetooth & ukuran kertas', icon: PrintIcon, ...gray, target: { stack: 'PrinterSettings' } },
};

export const MENU_KEYS = Object.keys(MENU_CATALOG) as MenuKey[];

/** Tab yang dikendalikan hak akses; tab lain (Pengaturan, Menu) selalu tampil. */
export const TAB_MENU_KEY: Partial<Record<keyof MainTabParamList, MenuKey>> = {
  Dashboard: 'dashboard',
  POS: 'pos',
  Orders: 'orders',
  Pesanan: 'pesanan',
  Products: 'products',
  Inventory: 'inventory',
  Customers: 'customers',
  Reports: 'reports',
  Employees: 'employees',
  StoreProfile: 'outlet',
  Integrations: 'integrations',
  Expenses: 'expenses',
};

/** Hak akses menu user yang sedang login (null dari server = semua boleh). */
export function useMenuAccess() {
  const allowed = useAppSelector((state) => state.access.allowedMenus);
  const user = useAppSelector((state) => state.auth.user);
  const isSuperadmin = !!user?.superadmin;
  const isManager = isSuperadmin || !!user?.roles.some((r) => r.roleCode === 'KEPALA_TOKO');
  const can = (key: MenuKey) => key === 'dashboard' || allowed === null || allowed.includes(key);
  const canTab = (route: keyof MainTabParamList) => {
    const key = TAB_MENU_KEY[route];
    return key ? can(key) : true;
  };
  return { can, canTab, isManager, isSuperadmin };
}
