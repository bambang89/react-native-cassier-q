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
  // Scanner generik: pemanggil yang menentukan apa yang terjadi kalau produk
  // ketemu/tidak — dipakai oleh POS (tambah ke keranjang), ProductsScreen
  // (cari), dan ProductFormScreen (buka utk edit / siapkan produk baru).
  Scanner: {
    onFound: (product: Product) => void;
    onNotFound?: (barcode: string) => void;
  };
  Categories: undefined;
  Units: undefined;
  // `prefillBarcode` dipakai waktu scan dari ProductFormScreen sendiri tapi
  // barcode-nya belum terdaftar — form direset ke mode tambah baru dgn
  // barcode itu sudah terisi.
  ProductForm: { product?: Product; prefillBarcode?: string };
  OrderDetail: { orderId: string };
  Receipt: { orderId: string };
  StoreProfile: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
