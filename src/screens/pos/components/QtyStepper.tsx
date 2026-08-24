import { View } from 'react-native';

import { Pressable } from '@/components/ui/forms';
import { Text } from '@/components/ui/typography';
import { useAppDispatch } from '@/store/hooks';
import { decrementItem, incrementItem } from '@/store/slices/cartSlice';
import type { CartItem } from '@/types/models';

import { styles } from '../POSScreen.styles';

export function QtyStepper({ item, tablet }: { item: CartItem; tablet?: boolean }) {
  const dispatch = useAppDispatch();
  return (
    <View style={[styles.stepper, tablet && styles.stepperTablet]}>
      <Pressable
        style={[styles.stepperButton, tablet && styles.stepperButtonTablet]}
        onPress={() => dispatch(decrementItem(item.product.id))}
        accessibilityLabel="Kurangi jumlah"
      >
        <Text weight="bold" style={tablet ? styles.stepperGlyphTablet : undefined}>
          −
        </Text>
      </Pressable>
      <View style={[styles.stepperQtyBox, tablet && styles.stepperQtyBoxTablet]}>
        <Text weight="bold" style={tablet ? styles.stepperGlyphTablet : undefined}>
          {item.quantity}
        </Text>
      </View>
      <Pressable
        style={[styles.stepperButton, tablet && styles.stepperButtonTablet]}
        onPress={() => dispatch(incrementItem(item.product.id))}
        accessibilityLabel="Tambah jumlah"
      >
        <Text weight="bold" style={tablet ? styles.stepperGlyphTablet : undefined}>
          +
        </Text>
      </Pressable>
    </View>
  );
}
