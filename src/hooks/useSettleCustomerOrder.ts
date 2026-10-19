import { Alert } from 'react-native';

import { markOrderPaid } from '@/api/customerOrdersApi';
import { apiErrorMessage } from '@/api/errors';
import type { Order } from '@/types/models';
import { useAppSelector } from '@/store/hooks';

/**
 * Setelah checkout Kasir: kalau keranjang berasal dari menu Pesanan, tandai
 * pesanan itu selesai & tautkan ke transaksinya. Panggil sebelum clearCart().
 */
export function useSettleCustomerOrder() {
  const customerOrder = useAppSelector((state) => state.cart.customerOrder);
  return (order: Order) => {
    if (!customerOrder) return;
    markOrderPaid(customerOrder.id, order.id).catch((error) =>
      Alert.alert(
        'Pesanan belum ditandai lunas',
        `${apiErrorMessage(error, 'Gagal menautkan transaksi.')} Transaksi tetap tersimpan — tandai ${customerOrder.orderNumber} selesai di menu Pesanan.`,
      ),
    );
  };
}
