import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '@/screens/auth/LoginScreen';
import RegisterScreen from '@/screens/auth/RegisterScreen';
import ForgotPasswordScreen from '@/screens/auth/ForgotPasswordScreen';
import ResetPasswordScreen from '@/screens/auth/ResetPasswordScreen';
import type { AuthStackParamList } from './types';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export default function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'ios_from_right', animationDuration: 280 }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
      <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    </Stack.Navigator>
  );
}
