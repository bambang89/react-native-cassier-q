import { useCallback, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import * as promoApi from '@/api/promoCodesApi';
import { apiErrorMessage } from '@/api/errors';
import { useMenuAccess } from '@/navigation/menuCatalog';
import type { PromoCode } from '@/types/models';
import type { RootStackParamList } from '@/navigation/types';
import { colors, radii, spacing } from '@/theme';
import { Button, Pressable, Switch } from '@/components/ui/forms';
import { Badge } from '@/components/ui/dataDisplay';
import { EmptyState } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { DiscountIcon, PlusIcon } from '@/components/icons/LineIcons';

import { promoStatus, promoSummary, shortDate } from './promoUtils';

/** Store promo codes with status, usage and an on/off switch; tap a card to edit it. */
export function PromoCodeList() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isManager } = useMenuAccess();
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);

  /** Loads the store's promo codes. */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setPromos(await promoApi.fetchPromoCodes());
    } catch (error) {
      Alert.alert('Gagal', apiErrorMessage(error, 'Kode promo gagal dimuat.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isManager) load();
    }, [isManager, load]),
  );

  /** Switches a promo on or off without opening the form. */
  const toggleActive = async (promo: PromoCode, active: boolean) => {
    setPromos((prev) => prev.map((p) => (p.id === promo.id ? { ...p, active } : p)));
    try {
      const { id: _id, usedCount: _used, ...payload } = promo;
      await promoApi.updatePromoCode(promo.id, { ...payload, active });
    } catch (error) {
      setPromos((prev) => prev.map((p) => (p.id === promo.id ? promo : p)));
      Alert.alert('Gagal', apiErrorMessage(error, 'Status promo tidak bisa diubah.'));
    }
  };

  if (!isManager) {
    return (
      <EmptyState
        icon={DiscountIcon}
        title="Khusus pemilik toko"
        description="Kode promo dibuat dan dikelola oleh pemilik / Kepala Toko. Kasir cukup memasukkan kodenya saat pembayaran."
      />
    );
  }

  return (
    <FlatList
      data={promos}
      keyExtractor={(item) => item.id}
      contentContainerStyle={local.list}
      refreshing={loading}
      onRefresh={load}
      ListHeaderComponent={
        <Button
          leftIcon={<PlusIcon size={16} color={colors.white} />}
          onPress={() => navigation.navigate('PromoCodeForm', {})}
          style={local.create}
        >
          Buat Kode Promo
        </Button>
      }
      ListEmptyComponent={
        loading ? null : (
          <EmptyState
            icon={DiscountIcon}
            title="Belum ada kode promo"
            description="Buat kode promo, misalnya HEMAT10 untuk diskon 10%, lalu bagikan ke pelanggan."
          />
        )
      }
      renderItem={({ item }) => {
        const status = promoStatus(item);
        return (
          <Pressable
            onPress={() => navigation.navigate('PromoCodeForm', { promo: item })}
            style={local.card}
          >
            <View style={local.cardTop}>
              <View style={local.codeTag}>
                <DiscountIcon size={14} color={colors.primary[600]} />
                <Text weight="bold" style={local.codeText}>
                  {item.code}
                </Text>
              </View>
              <Badge variant={status.tone}>{status.label}</Badge>
              <View style={local.spacer} />
              <Switch value={item.active} onValueChange={(v) => toggleActive(item, v)} />
            </View>
            <Text weight="semibold" style={local.name}>
              {item.name}
            </Text>
            <Text size="sm" color="secondary">
              {promoSummary(item)}
            </Text>
            <View style={local.metaRow}>
              <Text size="xs" color="muted">
                Dipakai {item.usedCount}
                {item.usageLimit !== null ? ` / ${item.usageLimit}` : ''} kali
              </Text>
              <Text size="xs" color="muted">
                {item.endsAt ? `s.d. ${shortDate(item.endsAt)}` : 'Tanpa batas waktu'}
              </Text>
            </View>
          </Pressable>
        );
      }}
    />
  );
}

const local = StyleSheet.create({
  list: { padding: spacing.base, paddingBottom: spacing['3xl'], gap: spacing.md },
  create: { marginBottom: spacing.sm },
  card: {
    padding: spacing.base,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: 4,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs },
  codeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.primary[300],
    backgroundColor: colors.primary[50],
  },
  codeText: { color: colors.primary[700], letterSpacing: 1 },
  spacer: { flex: 1 },
  name: { marginTop: 2 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
});
