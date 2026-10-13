import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCheckoutSettings, saveCheckoutSettings } from '@/store/slices/checkoutSettingsSlice';
import { useMenuAccess } from '@/navigation/menuCatalog';
import type { PaymentMethod } from '@/types/models';
import { colors, radii, spacing } from '@/theme';
import { Button, Pressable, Switch } from '@/components/ui/forms';
import { Text } from '@/components/ui/typography';
import { CheckIcon, ReceiptIcon } from '@/components/icons/LineIcons';

import { PAYMENT_METHOD_ICONS } from './paymentMethodIcons';

/**
 * Payment methods the store accepts, the method preselected at checkout and
 * whether PPN applies. Editable by the store owner; other roles see it read-only.
 */
export function CheckoutSettingsForm() {
  const dispatch = useAppDispatch();
  const settings = useAppSelector((state) => state.checkoutSettings.settings);
  const { isManager } = useMenuAccess();
  const [enabled, setEnabled] = useState<PaymentMethod[]>([]);
  const [defaultMethod, setDefaultMethod] = useState<PaymentMethod>('CASH');
  const [taxEnabled, setTaxEnabled] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    dispatch(fetchCheckoutSettings());
  }, [dispatch]);

  useEffect(() => {
    if (!settings) return;
    setEnabled(settings.paymentMethods.filter((m) => m.enabled).map((m) => m.code));
    setDefaultMethod(settings.defaultPaymentMethod);
    setTaxEnabled(settings.taxEnabled);
  }, [settings]);

  if (!settings) {
    return (
      <Text color="muted" align="center" style={local.loading}>
        Memuat pengaturan...
      </Text>
    );
  }

  const dirty =
    defaultMethod !== settings.defaultPaymentMethod ||
    taxEnabled !== settings.taxEnabled ||
    settings.paymentMethods.some((m) => m.enabled !== enabled.includes(m.code));

  /** Turns a method on or off; the default method cannot be switched off. */
  const toggleMethod = (code: PaymentMethod, on: boolean) => {
    if (!on && code === defaultMethod) {
      Alert.alert('Metode default', 'Pilih metode default lain dulu sebelum menonaktifkan metode ini.');
      return;
    }
    setEnabled((prev) => (on ? [...prev, code] : prev.filter((c) => c !== code)));
  };

  /** Saves the settings through the API. */
  const onSave = async () => {
    setSaving(true);
    try {
      await dispatch(
        saveCheckoutSettings({ enabledPaymentMethods: enabled, defaultPaymentMethod: defaultMethod, taxEnabled }),
      ).unwrap();
      Alert.alert('Tersimpan', 'Pengaturan pembayaran & PPN diperbarui.');
    } catch (error) {
      Alert.alert('Gagal', typeof error === 'string' ? error : 'Pengaturan tidak bisa disimpan.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={local.body} keyboardShouldPersistTaps="handled">
      {!isManager ? (
        <View style={local.notice}>
          <Text size="sm" color="secondary">
            Pengaturan ini hanya bisa diubah oleh pemilik / Kepala Toko.
          </Text>
        </View>
      ) : null}

      <Text size="xs" weight="semibold" color="muted" style={local.sectionLabel}>
        METODE PEMBAYARAN
      </Text>
      <View style={local.card}>
        {settings.paymentMethods.map((method, index) => {
          const Icon = PAYMENT_METHOD_ICONS[method.code];
          const on = enabled.includes(method.code);
          const isDefault = defaultMethod === method.code;
          return (
            <View key={method.code} style={[local.methodRow, index > 0 && local.divider]}>
              <View style={[local.methodIcon, on && local.methodIconOn]}>
                <Icon size={18} color={on ? colors.primary[600] : colors.gray[400]} />
              </View>
              <View style={local.methodBody}>
                <Text weight="semibold">{method.label}</Text>
                {on ? (
                  <Pressable
                    disabled={!isManager || isDefault}
                    onPress={() => setDefaultMethod(method.code)}
                    hitSlop={6}
                    style={[local.defaultChip, isDefault && local.defaultChipActive]}
                  >
                    {isDefault ? <CheckIcon size={11} color={colors.white} /> : null}
                    <Text size="xs" weight="semibold" style={isDefault ? local.defaultTextActive : local.defaultText}>
                      {isDefault ? 'Default' : 'Jadikan default'}
                    </Text>
                  </Pressable>
                ) : (
                  <Text size="xs" color="muted">
                    Tidak ditampilkan di kasir
                  </Text>
                )}
              </View>
              <Switch value={on} onValueChange={(v) => toggleMethod(method.code, v)} disabled={!isManager} />
            </View>
          );
        })}
      </View>
      <Text size="xs" color="muted" style={local.hint}>
        Metode default otomatis terpilih saat kasir membuka pembayaran.
      </Text>

      <Text size="xs" weight="semibold" color="muted" style={local.sectionLabel}>
        PAJAK
      </Text>
      <View style={[local.card, local.methodRow]}>
        <View style={[local.methodIcon, taxEnabled && local.methodIconOn]}>
          <ReceiptIcon size={18} color={taxEnabled ? colors.primary[600] : colors.gray[400]} />
        </View>
        <View style={local.methodBody}>
          <Text weight="semibold">PPN {settings.taxRatePercent}%</Text>
          <Text size="xs" color="muted">
            {taxEnabled
              ? `Setiap transaksi ditambah PPN ${settings.taxRatePercent}% dari total setelah diskon`
              : 'Transaksi tidak dikenakan PPN'}
          </Text>
        </View>
        <Switch value={taxEnabled} onValueChange={setTaxEnabled} disabled={!isManager} />
      </View>

      {isManager ? (
        <Button onPress={onSave} loading={saving} disabled={!dirty || saving} style={local.save}>
          Simpan Pengaturan
        </Button>
      ) : null}
    </ScrollView>
  );
}

const local = StyleSheet.create({
  body: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  loading: { marginTop: spacing.xl },
  notice: {
    padding: spacing.md,
    borderRadius: radii.md,
    backgroundColor: colors.warning[50],
    marginBottom: spacing.base,
  },
  sectionLabel: { letterSpacing: 0.8, marginBottom: spacing.sm, marginTop: spacing.sm },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  methodRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  methodIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[100],
  },
  methodIconOn: { backgroundColor: colors.primary[50] },
  methodBody: { flex: 1, gap: 4, alignItems: 'flex-start' },
  defaultChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.primary[200],
  },
  defaultChipActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  defaultText: { color: colors.primary[600] },
  defaultTextActive: { color: colors.white },
  hint: { marginTop: spacing.sm, marginBottom: spacing.lg },
  save: { marginTop: spacing.xl },
});
