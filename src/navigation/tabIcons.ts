import {
  BarChartIcon,
  BoxIcon,
  CartIcon,
  ClipboardIcon,
  DashboardIcon,
  EmployeeIcon,
  LayersIcon,
  PeopleIcon,
  PlugIcon,
  ReceiptIcon,
  SettingsIcon,
  StoreIcon,
} from '@/components/icons/LineIcons';
import type { LineIconProps } from '@/components/icons/LineIcons';
import type { ComponentType } from 'react';
import type { MainTabParamList } from './types';

// Ikon sidebar/tab bar — persis set SVG di cassier-q-webapp/tablet-pos.html.
// "Expenses" tidak ada di desain sidebar webapp (menu aslinya cuma sampai
// Integrasi + Settings), jadi tetap pakai BoxIcon-nya Pengeluaran sendiri (💸 lama
// diganti ReceiptIcon biar konsisten gaya garis, bukan solid/emoji).
export const TAB_ICONS: Record<keyof MainTabParamList, ComponentType<LineIconProps>> = {
  Dashboard: DashboardIcon,
  POS: CartIcon,
  Orders: ReceiptIcon,
  Pesanan: ClipboardIcon,
  Products: BoxIcon,
  Inventory: LayersIcon,
  Customers: PeopleIcon,
  Reports: BarChartIcon,
  Employees: EmployeeIcon,
  StoreProfile: StoreIcon,
  Integrations: PlugIcon,
  Expenses: ReceiptIcon,
  Profile: SettingsIcon,
};
