import type { ComponentType } from 'react';
import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Product } from '@/types/models';

import DashboardScreen from '@/screens/dashboard/DashboardScreen';
import POSScreen from '@/screens/pos/POSScreen';
import OrdersScreen from '@/screens/orders/OrdersScreen';
import PesananScreen from '@/screens/orders/PesananScreen';
import ProductsScreen from '@/screens/products/ProductsScreen';
import InventoryScreen from '@/screens/inventory/InventoryScreen';
import CustomersScreen from '@/screens/customers/CustomersScreen';
import ReportsScreen from '@/screens/reports/ReportsScreen';
import EmployeesScreen from '@/screens/employees/EmployeesScreen';
import StoreProfileScreen from '@/screens/profile/StoreProfileScreen';
import IntegrationsScreen from '@/screens/integrations/IntegrationsScreen';
import ExpensesScreen from '@/screens/expenses/ExpensesScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  POS: undefined;
  Orders: undefined;
  Pesanan: undefined;
  Products: undefined;
  Inventory: undefined;
  Customers: undefined;
  Reports: undefined;
  Employees: undefined;
  StoreProfile: undefined;
  Integrations: undefined;
  Expenses: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Scanner: {
    onFound: (product: Product) => void;
    onNotFound?: (barcode: string) => void;
  };
  Categories: undefined;
  Units: undefined;
  ProductForm: { product?: Product; prefillBarcode?: string };
  OrderDetail: { orderId: string };
  Receipt: { orderId: string };
  PrinterSettings: undefined;
  CustomerDetail: { customerId: string };
  Suppliers: undefined;
  PurchaseOrders: undefined;
  PurchaseOrderForm: undefined;
  PurchaseOrderDetail: { purchaseOrderId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export const PHONE_CORE_TABS = new Set<keyof MainTabParamList>([
  'Dashboard',
  'POS',
  'Products',
  'Orders',
  'Reports',
  'Expenses',
  'Profile',
]);

export const TAB_SCREENS: {
  name: keyof MainTabParamList;
  title: string;
  component: ComponentType<any>;
}[] = [
  { name: 'Dashboard', title: 'Dashboard', component: DashboardScreen },
  { name: 'POS', title: 'Kasir', component: POSScreen },
  { name: 'Orders', title: 'Transaksi', component: OrdersScreen },
  { name: 'Pesanan', title: 'Pesanan', component: PesananScreen },
  { name: 'Products', title: 'Produk', component: ProductsScreen },
  { name: 'Inventory', title: 'Inventori', component: InventoryScreen },
  { name: 'Customers', title: 'Pelanggan', component: CustomersScreen },
  { name: 'Reports', title: 'Laporan', component: ReportsScreen },
  { name: 'Employees', title: 'Karyawan', component: EmployeesScreen },
  { name: 'StoreProfile', title: 'Outlet', component: StoreProfileScreen },
  { name: 'Integrations', title: 'Integrasi', component: IntegrationsScreen },
  { name: 'Expenses', title: 'Pengeluaran', component: ExpensesScreen },
  { name: 'Profile', title: 'Pengaturan', component: ProfileScreen },
];
