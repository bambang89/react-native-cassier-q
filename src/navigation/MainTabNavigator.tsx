import { StyleSheet, Text, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import POSScreen from '@/screens/pos/POSScreen';
import ProductsScreen from '@/screens/products/ProductsScreen';
import OrdersScreen from '@/screens/orders/OrdersScreen';
import ReportsScreen from '@/screens/reports/ReportsScreen';
import ProfileScreen from '@/screens/profile/ProfileScreen';
import type { MainTabParamList } from './types';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, fontFamilies, radii, spacing } from '@/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

const TAB_ICONS: Record<keyof MainTabParamList, string> = {
  POS: '🛒',
  Products: '📦',
  Orders: '🧾',
  Reports: '📊',
  Profile: '👤',
};

function TabIcon({ name, focused }: { name: keyof MainTabParamList; focused: boolean }) {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.iconGlyph}>{TAB_ICONS[name]}</Text>
    </View>
  );
}

export default function MainTabNavigator() {
  const { isTabletLandscape } = useResponsive();

  return (
    <Tab.Navigator
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
      <Tab.Screen
        name="POS"
        component={POSScreen}
        options={{ title: 'Kasir', tabBarIcon: ({ focused }) => <TabIcon name="POS" focused={focused} /> }}
      />
      <Tab.Screen
        name="Products"
        component={ProductsScreen}
        options={{ title: 'Produk', tabBarIcon: ({ focused }) => <TabIcon name="Products" focused={focused} /> }}
      />
      <Tab.Screen
        name="Orders"
        component={OrdersScreen}
        options={{ title: 'Riwayat', tabBarIcon: ({ focused }) => <TabIcon name="Orders" focused={focused} /> }}
      />
      <Tab.Screen
        name="Reports"
        component={ReportsScreen}
        options={{ title: 'Laporan', tabBarIcon: ({ focused }) => <TabIcon name="Reports" focused={focused} /> }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: 'Akun', tabBarIcon: ({ focused }) => <TabIcon name="Profile" focused={focused} /> }}
      />
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
  iconGlyph: {
    fontSize: 18,
  },
});
