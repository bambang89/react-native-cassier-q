import { Fragment, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { setSessionExpiredHandler } from '@/api/client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapAuth, sessionExpired } from '@/store/slices/authSlice';
import { store } from '@/store';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import ScannerScreen from '@/screens/pos/ScannerScreen';
import CategoriesScreen from '@/screens/products/CategoriesScreen';
import UnitsScreen from '@/screens/products/UnitsScreen';
import ProductFormScreen from '@/screens/products/ProductFormScreen';
import ProductPhotoCameraScreen from '@/screens/products/ProductPhotoCameraScreen';
import OrderDetailScreen from '@/screens/orders/OrderDetailScreen';
import ReceiptScreen from '@/screens/orders/ReceiptScreen';
import PrinterSettingsScreen from '@/screens/profile/PrinterSettingsScreen';
import CustomerDetailScreen from '@/screens/customers/CustomerDetailScreen';
import SuppliersScreen from '@/screens/suppliers/SuppliersScreen';
import PurchaseOrdersScreen from '@/screens/purchaseOrders/PurchaseOrdersScreen';
import PurchaseOrderFormScreen from '@/screens/purchaseOrders/PurchaseOrderFormScreen';
import PurchaseOrderDetailScreen from '@/screens/purchaseOrders/PurchaseOrderDetailScreen';
import type { RootStackParamList } from './types';
import { useResponsive } from '@/hooks/useResponsive';
import { colors } from '@/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

// Deep link cassierq://<path>, mis. `cassierq://pos` atau `cassierq://customers`
// — dari notifikasi, QR, atau `xcrun simctl openurl booted cassierq://menu` saat dev.
const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['cassierq://'],
  config: {
    screens: {
      Main: {
        screens: {
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
          Profile: 'settings',
          Menu: 'menu',
        },
      },
      Categories: 'categories',
      Units: 'units',
      Suppliers: 'suppliers',
      PurchaseOrders: 'purchase-orders',
      PrinterSettings: 'printer',
      OrderDetail: 'orders/:orderId',
      CustomerDetail: 'customers/:customerId',
    },
  },
};

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const { isPhone } = useResponsive();

  useEffect(() => {
    // Biasanya sudah dimulai App selama splash; jangan cek ulang kalau begitu.
    if (store.getState().auth.status === 'idle') dispatch(bootstrapAuth());
    setSessionExpiredHandler(() => dispatch(sessionExpired()));
    return () => setSessionExpiredHandler(null);
  }, [dispatch]);

  if (status === 'idle' || status === 'checking') {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }

  const isAuthenticated = status === 'authenticated';

  return (
    <Fragment>
      <NavigationContainer linking={linking}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            // HP: dorong dari kanan (pola iOS/Android); tablet: naik halus dari bawah
            // seperti panel, karena layar lebar tidak cocok dengan geser penuh.
            animation: isPhone ? 'slide_from_right' : 'fade_from_bottom',
            animationDuration: 280,
            gestureEnabled: true,
            contentStyle: { backgroundColor: colors.canvas },
          }}
        >
          {isAuthenticated ? (
            <Fragment>
              <Stack.Screen name="Main" component={MainTabNavigator} options={{ animation: 'fade' }} />
              <Stack.Screen
                name="Scanner"
                component={ScannerScreen}
                options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen name="Categories" component={CategoriesScreen} />
              <Stack.Screen name="Units" component={UnitsScreen} />
              <Stack.Screen name="ProductForm" component={ProductFormScreen} />
              <Stack.Screen
                name="ProductPhotoCamera"
                component={ProductPhotoCameraScreen}
                options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
              <Stack.Screen name="Receipt" component={ReceiptScreen} />
              <Stack.Screen name="PrinterSettings" component={PrinterSettingsScreen} />
              <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
              <Stack.Screen name="Suppliers" component={SuppliersScreen} />
              <Stack.Screen name="PurchaseOrders" component={PurchaseOrdersScreen} />
              <Stack.Screen name="PurchaseOrderForm" component={PurchaseOrderFormScreen} />
              <Stack.Screen name="PurchaseOrderDetail" component={PurchaseOrderDetailScreen} />
            </Fragment>
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} options={{ animation: 'fade' }} />
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
});
