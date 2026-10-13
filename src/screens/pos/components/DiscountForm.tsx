import { View } from 'react-native';

import { Button, Input, Pressable } from '@/components/ui/forms';
import { Text } from '@/components/ui/typography';
import { ChevronDownIcon } from '@/components/icons/LineIcons';
import { colors } from '@/theme';

import { styles } from '../POSScreen.styles';

export function DiscountForm({
  discountType,
  onChangeDiscountType,
  discountValue,
  onChangeDiscountValue,
  ppnEnabled,
  onDone,
}: {
  discountType: 'percent' | 'amount';
  onChangeDiscountType: () => void;
  discountValue: string;
  onChangeDiscountValue: (value: string) => void;
  /** From the store settings — shown read-only; changed in Pengaturan → Pembayaran & PPN. */
  ppnEnabled: boolean;
  onDone: () => void;
}) {
  return (
    <View>
      <Text weight="bold" size="lg" style={styles.modalTitle}>
        % Diskon & Pajak
      </Text>

      <Text weight="semibold" size="sm" style={styles.discountLabel}>
        Diskon (F7)
      </Text>
      <View style={styles.discountRow}>
        <Pressable style={styles.discountTypeToggle} onPress={onChangeDiscountType}>
          <Text weight="semibold" size="sm">
            {discountType === 'percent' ? '%' : 'Rp'}
          </Text>
          <ChevronDownIcon size={12} color={colors.text.muted} />
        </Pressable>
        <Input
          keyboardType="numeric"
          value={discountValue}
          onChangeText={onChangeDiscountValue}
          placeholder="0"
          style={styles.discountInput}
        />
      </View>

      <View style={styles.ppnRow}>
        <View>
          <Text weight="semibold" size="sm">
            PPN 11%
          </Text>
          <Text size="xs" color="muted">
            Diatur di Pengaturan → Pembayaran & PPN
          </Text>
        </View>
        <Text weight="semibold" size="sm" color={ppnEnabled ? 'success' : 'muted'}>
          {ppnEnabled ? 'Aktif' : 'Tidak aktif'}
        </Text>
      </View>

      <Button fullWidth onPress={onDone} style={styles.payButton}>
        Selesai
      </Button>
    </View>
  );
}
