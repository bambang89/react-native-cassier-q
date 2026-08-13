import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { setSessionExpiredHandler } from '../api/client';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { bootstrapAuth, sessionExpired } from '../store/slices/authSlice';
import AuthNavigator from './AuthNavigator';
import MainTabNavigator from './MainTabNavigator';
import ScannerScreen from '../screens/pos/ScannerScreen';
import type { RootStackParamList } from './types';

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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
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
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
