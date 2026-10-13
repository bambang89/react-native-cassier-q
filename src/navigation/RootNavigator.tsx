import { Fragment, useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import type { LinkingOptions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { setSessionExpiredHandler } from '@/api/client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapAuth, sessionExpired } from '@/store/slices/authSlice';
import { fetchMyMenus, restoreActiveStore } from '@/store/slices/accessSlice';
import StorePickerScreen from '@/screens/admin/StorePickerScreen';
import MenuAccessScreen from '@/screens/admin/MenuAccessScreen';
import { store } from '@/store';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import ScannerScreen from '@/screens/pos/ScannerScreen';
import CategoriesScreen from '@/screens/products/CategoriesScreen';
import UnitsScreen from '@/screens/products/UnitsScreen';
import ProductFormScreen from '@/screens/products/ProductFormScreen';
import OrderDetailScreen from '@/screens/orders/OrderDetailScreen';
import ReceiptScreen from '@/screens/orders/ReceiptScreen';
import CheckoutScreen from '@/screens/pos/CheckoutScreen';
import CheckoutSettingsScreen from '@/screens/settings/CheckoutSettingsScreen';
import PromoCodesScreen from '@/screens/settings/PromoCodesScreen';
import PromoCodeFormScreen from '@/screens/settings/PromoCodeFormScreen';
import BundlesScreen from '@/screens/settings/BundlesScreen';
import BundleFormScreen from '@/screens/settings/BundleFormScreen';
import StockOpnameScreen from '@/screens/inventory/StockOpnameScreen';
import BadStockFormScreen from '@/screens/inventory/BadStockFormScreen';
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
      MenuAccess: 'menu-access',
      StorePicker: 'stores',
      OrderDetail: 'orders/:orderId',
      CustomerDetail: 'customers/:customerId',
    },
  },
};

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);
  const isSuperadmin = useAppSelector((state) => !!state.auth.user?.superadmin);
  const { activeStore, activeStoreLoaded } = useAppSelector((state) => state.access);
  const { isPhone } = useResponsive();
  const isAuthenticated = status === 'authenticated';
  // SUPERADMIN tidak terikat toko: wajib memilih toko dulu sebelum masuk app.
  const needsStore = isAuthenticated && isSuperadmin && activeStoreLoaded && !activeStore;
  const storeKey = activeStore?.id ?? 'own-store';

  useEffect(() => {
    if (isAuthenticated && isSuperadmin) dispatch(restoreActiveStore());
  }, [dispatch, isAuthenticated, isSuperadmin]);

  // Menu yang diizinkan Kepala Toko — dimuat ulang tiap login & tiap ganti toko.
  useEffect(() => {
    if (!isAuthenticated) return;
    if (isSuperadmin && !activeStore) return;
    dispatch(fetchMyMenus());
  }, [dispatch, isAuthenticated, isSuperadmin, activeStore]);

  useEffect(() => {
    // Biasanya sudah dimulai App selama splash; jangan cek ulang kalau begitu.
    if (store.getState().auth.status === 'idle') dispatch(bootstrapAuth());
    setSessionExpiredHandler(() => dispatch(sessionExpired()));
    return () => setSessionExpiredHandler(null);
  }, [dispatch]);

  if (status === 'idle' || status === 'checking' || (isAuthenticated && isSuperadmin && !activeStoreLoaded)) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={colors.primary[600]} />
      </View>
    );
  }


  return (
    <Fragment>
      <NavigationContainer linking={linking}>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            // HP: dorong dari kanan dengan paralaks ala iOS (juga di Android);
            // tablet: naik halus dari bawah seperti panel, karena layar lebar
            // tidak cocok dengan geser penuh.
            animation: isPhone ? 'ios_from_right' : 'fade_from_bottom',
            animationDuration: 280,
            gestureEnabled: true,
            contentStyle: { backgroundColor: colors.canvas },
          }}
        >
          {needsStore ? (
            <Stack.Screen name="StorePicker" component={StorePickerScreen} options={{ animation: 'fade' }} />
          ) : isAuthenticated ? (
            <Fragment>
              {/* navigationKey: ganti toko (SUPERADMIN) memasang ulang semua tab → data termuat ulang. */}
              <Stack.Screen
                name="Main"
                component={MainTabNavigator}
                navigationKey={storeKey}
                options={{ animation: 'fade' }}
              />
              <Stack.Screen
                name="Scanner"
                component={ScannerScreen}
                options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
              />
              <Stack.Screen name="Categories" component={CategoriesScreen} />
              <Stack.Screen name="Units" component={UnitsScreen} />
              <Stack.Screen name="ProductForm" component={ProductFormScreen} />
              <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
              <Stack.Screen name="Checkout" component={CheckoutScreen} />
              <Stack.Screen name="CheckoutSettings" component={CheckoutSettingsScreen} />
              <Stack.Screen name="PromoCodes" component={PromoCodesScreen} />
              <Stack.Screen name="PromoCodeForm" component={PromoCodeFormScreen} />
              <Stack.Screen name="Bundles" component={BundlesScreen} />
              <Stack.Screen name="BundleForm" component={BundleFormScreen} />
              <Stack.Screen name="StockOpname" component={StockOpnameScreen} />
              <Stack.Screen name="BadStockForm" component={BadStockFormScreen} />
              <Stack.Screen name="Receipt" component={ReceiptScreen} />
              <Stack.Screen name="PrinterSettings" component={PrinterSettingsScreen} />
              <Stack.Screen name="CustomerDetail" component={CustomerDetailScreen} />
              <Stack.Screen name="Suppliers" component={SuppliersScreen} />
              <Stack.Screen name="PurchaseOrders" component={PurchaseOrdersScreen} />
              <Stack.Screen name="PurchaseOrderForm" component={PurchaseOrderFormScreen} />
              <Stack.Screen name="PurchaseOrderDetail" component={PurchaseOrderDetailScreen} />
              <Stack.Screen name="MenuAccess" component={MenuAccessScreen} />
              <Stack.Screen
                name="StorePicker"
                component={StorePickerScreen}
                options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
              />
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
