import type { NavigatorScreenParams } from '@react-navigation/native';
import type { Product } from '@/types/models';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  POS: undefined;
  Orders: undefined;
  Pesanan: undefined;
  Products: undefined;
  Inventory: undefined;
  Customers: undefined;
  Reports: undefined;
  Employees: undefined;
  StoreProfile: undefined;
  Integrations: undefined;
  Expenses: undefined;
  Profile: undefined;
};

export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  Scanner: {
    onFound: (product: Product) => void;
    onNotFound?: (barcode: string) => void;
  };
  Categories: undefined;
  Units: undefined;
  ProductForm: { product?: Product; prefillBarcode?: string };
  OrderDetail: { orderId: string };
  Receipt: { orderId: string };
  CustomerDetail: { customerId: string };
  Suppliers: undefined;
  PurchaseOrders: undefined;
  PurchaseOrderForm: undefined;
  PurchaseOrderDetail: { purchaseOrderId: string };
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
