import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Product } from '@/types/models';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
};

export type MainTabParamList = {
  POS: undefined;
  Products: undefined;
  Orders: undefined;
  Reports: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Scanner: undefined;
  Categories: undefined;
  ProductForm: { product?: Product };
  OrderDetail: { orderId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
