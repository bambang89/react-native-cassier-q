import { StyleSheet, TextInput, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';
import { Button, Pressable } from '@/components/ui/forms';
import { Text } from '@/components/ui/typography';
import { PlusIcon, TrashIcon } from '@/components/icons/LineIcons';

/** Editable wholesale step as typed in the form. */
export type TierDraft = { minQuantity: string; unitPrice: string };

const rupiah = (value: number) => `Rp${Math.round(value).toLocaleString('id-ID')}`;

/**
 * "Harga Grosir" editor: rows of "from N <unit> → price per <unit>", with the saving
 * versus the normal price. Steps apply to the product's total in one sale.
 */
export function PriceTiersSection({
  tiers,
  onChange,
  normalPrice,
  unitName,
  disabled,
}: {
  tiers: TierDraft[];
  onChange: (tiers: TierDraft[]) => void;
  normalPrice: number;
  unitName: string;
  disabled?: boolean;
}) {
  /** Updates one row. */
  const patch = (index: number, value: Partial<TierDraft>) =>
    onChange(tiers.map((t, i) => (i === index ? { ...t, ...value } : t)));

  /** Adds a row suggesting the next quantity step. */
  const addRow = () => {
    const last = tiers[tiers.length - 1];
    const nextQty = last && Number(last.minQuantity) ? Number(last.minQuantity) * 2 : 10;
    onChange([...tiers, { minQuantity: String(nextQty), unitPrice: '' }]);
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.flex}>
          <Text weight="bold">Harga Grosir</Text>
          <Text size="xs" color="muted">
            Makin banyak dibeli, makin murah per {unitName}. Dihitung dari total {unitName} produk ini dalam satu
            transaksi (semua satuan dijumlahkan).
          </Text>
        </View>
      </View>

      <View style={[styles.row, styles.normalRow]}>
        <Text size="sm" color="secondary" style={styles.flex}>
          1 {unitName} ke atas (harga normal)
        </Text>
        <Text size="sm" weight="semibold">
          {normalPrice > 0 ? `${rupiah(normalPrice)} / ${unitName}` : '—'}
        </Text>
      </View>

      {tiers.map((tier, index) => {
        const price = Number(tier.unitPrice || 0);
        const saving = normalPrice > 0 && price > 0 ? Math.round(((normalPrice - price) / normalPrice) * 100) : 0;
        return (
          <View key={index} style={styles.row}>
            <Text size="sm" color="secondary">
              ≥
            </Text>
            <TextInput
              value={tier.minQuantity}
              onChangeText={(v) => patch(index, { minQuantity: v.replace(/[^0-9.]/g, '') })}
              keyboardType="decimal-pad"
              editable={!disabled}
              style={[styles.input, styles.qtyInput]}
              accessibilityLabel={`Minimal jumlah tingkat ${index + 1}`}
            />
            <Text size="sm" color="secondary">
              {unitName}
            </Text>
            <View style={styles.flex} />
            <Text size="sm" color="secondary">
              Rp
            </Text>
            <TextInput
              value={tier.unitPrice}
              onChangeText={(v) => patch(index, { unitPrice: v.replace(/\D/g, '') })}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.gray[400]}
              editable={!disabled}
              style={[styles.input, styles.priceInput]}
              accessibilityLabel={`Harga tingkat ${index + 1}`}
            />
            {saving > 0 ? (
              <Text size="xs" weight="semibold" style={styles.saving}>
                -{saving}%
              </Text>
            ) : null}
            {!disabled ? (
              <Pressable
                onPress={() => onChange(tiers.filter((_, i) => i !== index))}
                hitSlop={8}
                style={styles.remove}
                accessibilityLabel={`Hapus tingkat ${index + 1}`}
              >
                <TrashIcon size={14} color={colors.error[600]} />
              </Pressable>
            ) : null}
          </View>
        );
      })}

      {!disabled ? (
        <Button
          variant="outline"
          size="sm"
          leftIcon={<PlusIcon size={14} color={colors.primary[600]} />}
          onPress={addRow}
          style={styles.add}
        >
          Tambah Tingkat Harga
        </Button>
      ) : (
        <Text size="xs" color="muted" style={styles.add}>
          Anda tidak punya izin mengubah harga grosir.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.base,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    marginBottom: spacing.base,
  },
  header: { flexDirection: 'row', marginBottom: spacing.sm },
  flex: { flex: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
  },
  normalRow: { borderTopWidth: 0 },
  input: {
    paddingVertical: 6,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
    textAlign: 'right',
  },
  qtyInput: { width: 56 },
  priceInput: { width: 88 },
  saving: { color: colors.success[700] },
  remove: {
    width: 28,
    height: 28,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.error[50],
  },
  add: { marginTop: spacing.sm },
});
