import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import POSScreen from '@/screens/pos/POSScreen';
import ProductsScreen from '@/screens/products/ProductsScreen';
import OrdersScreen from '@/screens/orders/OrdersScreen';
import ReportsScreen from '@/screens/reports/ReportsScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import type { MainTabParamList } from './types';
import { colors } from '@/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.text.muted,
        tabBarStyle: { borderTopColor: colors.border },
      }}
    >
      <Tab.Screen name="POS" component={POSScreen} options={{ title: 'Kasir' }} />
      <Tab.Screen name="Products" component={ProductsScreen} options={{ title: 'Produk' }} />
      <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'Riwayat' }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: 'Laporan' }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Akun' }} />
    </Tab.Navigator>
  );
}
