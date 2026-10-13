import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { clearCart, selectCartTotal } from '@/store/slices/cartSlice';
import type { RootStackParamList } from '@/navigation/types';
import type { Order } from '@/types/models';
import { colors } from '@/theme';
import { AppBar } from '@/components/ui/recipes';

import { CheckoutForm } from './components';

type Props = NativeStackScreenProps<RootStackParamList, 'Checkout'>;

/**
 * Full-page checkout for phones (tablet landscape keeps the modal next to the
 * order panel). Reads the cart from the store; on success the cart is cleared and
 * the receipt replaces this page, or the cashier returns straight to the POS.
 */
export default function CheckoutScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const cartItems = useAppSelector((state) => state.cart.items);
  const cartTotal = useAppSelector(selectCartTotal);

  /** Clears the cart, then shows the receipt or goes back to the POS. */
  const onDone = (order: Order, withReceipt: boolean) => {
    dispatch(clearCart());
    if (withReceipt) navigation.replace('Receipt', { orderId: order.id });
    else navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <AppBar title="Pembayaran" onBack={navigation.goBack} />
      <CheckoutForm
        layout="page"
        total={cartTotal}
        cartItems={cartItems}
        showItemsList
        onDone={onDone}
        onCancel={navigation.goBack}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
});
