import { useCallback, useState } from 'react';
import { Alert, FlatList, Image, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import * as bundlesApi from '@/api/bundlesApi';
import { apiErrorMessage } from '@/api/errors';
import { useMenuAccess } from '@/navigation/menuCatalog';
import type { RootStackParamList } from '@/navigation/types';
import type { Product } from '@/types/models';
import { colors, radii, spacing } from '@/theme';
import { Button, Pressable } from '@/components/ui/forms';
import { EmptyState } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';
import { BoxIcon, ChevronRightIcon, PlusIcon } from '@/components/icons/LineIcons';

import { rupiah } from './promoUtils';

/** Bundles of the store with contents, price and how many can still be sold. Kepala Toko only. */
export function BundleList() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { isManager } = useMenuAccess();
  const [bundles, setBundles] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  /** Loads the store's bundles. */
  const load = useCallback(async () => {
    setLoading(true);
    try {
      setBundles(await bundlesApi.fetchBundles());
    } catch (error) {
      Alert.alert('Gagal', apiErrorMessage(error, 'Paket gagal dimuat.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isManager) load();
    }, [isManager, load]),
  );

  if (!isManager) {
    return (
      <EmptyState
        icon={BoxIcon}
        title="Khusus Kepala Toko"
        description="Paket bundling dibuat dan diatur oleh Kepala Toko. Kasir cukup menjual paketnya dari layar Kasir."
      />
    );
  }

  return (
    <FlatList
      data={bundles}
      keyExtractor={(item) => item.id}
      contentContainerStyle={local.list}
      refreshing={loading}
      onRefresh={load}
      ListHeaderComponent={
        <Button
          leftIcon={<PlusIcon size={16} color={colors.white} />}
          onPress={() => navigation.navigate('BundleForm', {})}
          style={local.create}
        >
          Buat Paket Baru
        </Button>
      }
      ListEmptyComponent={
        loading ? null : (
          <EmptyState
            icon={BoxIcon}
            title="Belum ada paket"
            description="Gabungkan beberapa produk jadi satu paket dengan harga khusus, mis. Paket Sarapan = Roti + Susu."
          />
        )
      }
      renderItem={({ item }) => {
        const items = item.bundleItems ?? [];
        const soldOut = item.stockQuantity <= 0;
        return (
          <Pressable onPress={() => navigation.navigate('BundleForm', { bundle: item })} style={local.card}>
            <View style={local.thumb}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={local.thumbImage} />
              ) : (
                <Text size="2xl">🎁</Text>
              )}
            </View>
            <View style={local.body}>
              <Text weight="bold" numberOfLines={1}>
                {item.productName}
              </Text>
              <Text size="xs" color="secondary" numberOfLines={2}>
                {items.map((i) => `${Number(i.quantity)} ${i.unitName} ${i.productName}`).join(' · ') || 'Belum ada isi'}
              </Text>
              <View style={local.metaRow}>
                <Text weight="bold" style={local.price}>
                  {rupiah(item.sellingPrice)}
                </Text>
                <View style={[local.stockPill, soldOut ? local.stockOut : local.stockOk]}>
                  <Text size="xs" weight="semibold" style={soldOut ? local.stockOutText : local.stockOkText}>
                    {soldOut ? 'Isi habis' : `Bisa dijual ${item.stockQuantity}`}
                  </Text>
                </View>
              </View>
            </View>
            <ChevronRightIcon size={18} color={colors.gray[400]} />
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warning[50],
    overflow: 'hidden',
  },
  thumbImage: { width: '100%', height: '100%' },
  body: { flex: 1, gap: 2 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 },
  price: { color: colors.primary[700] },
  stockPill: { paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: 9999 },
  stockOk: { backgroundColor: colors.success[50] },
  stockOkText: { color: colors.success[700] },
  stockOut: { backgroundColor: colors.error[50] },
  stockOutText: { color: colors.error[600] },
});
