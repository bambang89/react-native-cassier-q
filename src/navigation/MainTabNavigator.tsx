import { StyleSheet, View } from 'react-native';
import type { ComponentType } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

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
import SidebarTabBar from './SidebarTabBar';
import { TAB_ICONS } from './tabIcons';
import type { MainTabParamList } from './types';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, fontFamilies, radii, spacing } from '@/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Tab yang tetap tampil di bottom tab bar HP — daftar menu tablet/sidebar jauh
// lebih panjang (lihat SidebarTabBar), tapi bottom bar HP cuma muat beberapa
// item sebelum jadi tidak terbaca. Sisanya tetap bisa dibuka lewat sidebar tablet.
// (cassier-q-webapp/mobile-*.html sebetulnya cuma taruh Beranda/Transaksi/Kasir/
// Produk/Menu di bottom nav HP, sisanya ditumpuk di satu layar "Menu" — kita
// belum bikin layar Menu itu, jadi untuk sekarang Reports/Expenses/Profile masih
// tab tersendiri biar tetap gampang dijangkau.)
const PHONE_CORE_TABS = new Set<keyof MainTabParamList>([
  'Dashboard',
  'POS',
  'Products',
  'Orders',
  'Reports',
  'Expenses',
  'Profile',
]);

function TabIcon({ name, focused }: { name: keyof MainTabParamList; focused: boolean }) {
  const Icon = TAB_ICONS[name];
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Icon size={18} color={focused ? colors.primary[600] : colors.text.muted} />
    </View>
  );
}

const TAB_SCREENS: {
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

export default function MainTabNavigator() {
  const { isTabletLandscape } = useResponsive();

  return (
    <Tab.Navigator
      tabBar={isTabletLandscape ? (props) => <SidebarTabBar {...props} /> : undefined}
      screenOptions={{
        headerShown: false,
        tabBarPosition: isTabletLandscape ? 'left' : 'bottom',
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: { fontFamily: fontFamilies.semibold, fontSize: 12 },
        tabBarStyle: isTabletLandscape
          ? styles.sidebar
          : { borderTopColor: colors.border, height: 64, paddingTop: 6, paddingBottom: 8 },
        tabBarItemStyle: isTabletLandscape ? styles.sidebarItem : undefined,
        tabBarLabelPosition: isTabletLandscape ? 'beside-icon' : 'below-icon',
      }}
    >
      {TAB_SCREENS.map(({ name, title, component }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            title,
            tabBarIcon: ({ focused }) => <TabIcon name={name} focused={focused} />,
            tabBarButton: !isTabletLandscape && !PHONE_CORE_TABS.has(name) ? () => null : undefined,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 220,
    borderTopWidth: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  sidebarItem: {
    flexDirection: 'row',
    borderRadius: radii.md,
    marginBottom: spacing.xs,
    paddingVertical: spacing.sm,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.primary[50],
  },
});
