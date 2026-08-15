import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { setSessionExpiredHandler } from '@/api/client';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { bootstrapAuth, sessionExpired } from '@/store/slices/authSlice';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import ScannerScreen from '@/screens/pos/ScannerScreen';
import CategoriesScreen from '@/screens/products/CategoriesScreen';
import UnitsScreen from '@/screens/products/UnitsScreen';
import ProductFormScreen from '@/screens/products/ProductFormScreen';
import OrderDetailScreen from '@/screens/orders/OrderDetailScreen';
import ReceiptScreen from '@/screens/orders/ReceiptScreen';
import StoreProfileScreen from '@/screens/profile/StoreProfileScreen';
import type { RootStackParamList } from './types';
import { colors } from '@/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    dispatch(bootstrapAuth());
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
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={MainTabNavigator} />
            <Stack.Screen
              name="Scanner"
              component={ScannerScreen}
              options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
            />
            <Stack.Screen name="Categories" component={CategoriesScreen} />
            <Stack.Screen name="Units" component={UnitsScreen} />
            <Stack.Screen name="ProductForm" component={ProductFormScreen} />
            <Stack.Screen name="OrderDetail" component={OrderDetailScreen} />
            <Stack.Screen name="Receipt" component={ReceiptScreen} />
            <Stack.Screen name="StoreProfile" component={StoreProfileScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
});
