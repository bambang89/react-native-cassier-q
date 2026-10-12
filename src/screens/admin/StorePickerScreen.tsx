import { useEffect, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

import type { AdminStore } from '@/api/accessApi';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { logout } from '@/store/slices/authSlice';
import { chooseActiveStore, fetchAdminStores } from '@/store/slices/accessSlice';
import { colors, radii, spacing, staggerDelay } from '@/theme';
import { CheckIcon, ChevronRightIcon, SearchIcon, StoreIcon } from '@/components/icons/LineIcons';
import { Input, Link } from '@/components/ui/forms';
import { Badge } from '@/components/ui/dataDisplay';
import { EmptyState, GradientBackground } from '@/components/ui/recipes';
import { FadeInView, PressableScale } from '@/components/ui/motion';
import { Heading, Text } from '@/components/ui/typography';

/**
 * Khusus SUPERADMIN (pemilik aplikasi): pilih toko yang mau dibantu. Semua
 * layar lalu bekerja atas nama toko itu (header X-Store-Id) sampai diganti.
 */
export default function StorePickerScreen() {
  const dispatch = useAppDispatch();
  const navigation = useNavigation();
  const user = useAppSelector((state) => state.auth.user);
  const { stores, storesStatus, activeStore } = useAppSelector((state) => state.access);
  const [query, setQuery] = useState('');

  useEffect(() => {
    dispatch(fetchAdminStores());
  }, [dispatch]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stores;
    return stores.filter((s) =>
      [s.storeName, s.storeCode, s.city ?? '', s.address ?? ''].some((v) => v.toLowerCase().includes(q)),
    );
  }, [stores, query]);

  const choose = async (store: AdminStore) => {
    await dispatch(chooseActiveStore({ id: store.id, name: store.storeName }));
    if (navigation.canGoBack()) navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.hero}>
        <GradientBackground colors={[colors.darkBg, '#123E7A', colors.primary[600]]} />
        <FadeInView offsetY={10}>
          <Text size="xs" weight="bold" style={styles.eyebrow}>
            PEMILIK APLIKASI
          </Text>
          <Heading level="h4" style={styles.heroTitle}>
            Pilih toko yang ingin dibantu
          </Heading>
          <Text size="sm" style={styles.heroSub}>
            {`Halo, ${user?.name?.split(' ')[0] ?? 'Admin'}. Anda bisa melihat dan mengelola seluruh data toko yang dipilih.`}
          </Text>
        </FadeInView>
      </View>

      <View style={styles.search}>
        <Input
          placeholder="Cari nama toko, kode, atau kota"
          value={query}
          onChangeText={setQuery}
          leftElement={<SearchIcon size={16} color={colors.text.muted} />}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={storesStatus === 'loading'} onRefresh={() => dispatch(fetchAdminStores())} />
        }
        renderItem={({ item, index }) => {
          const selected = activeStore?.id === item.id;
          return (
            <FadeInView delay={staggerDelay(index)} offsetY={10}>
              <PressableScale
                activeScale={0.98}
                onPress={() => choose(item)}
                style={[styles.card, selected && styles.cardSelected]}
                accessibilityRole="button"
              >
                <View style={[styles.avatar, selected && styles.avatarSelected]}>
                  <StoreIcon size={20} color={selected ? colors.white : colors.primary[600]} />
                </View>
                <View style={styles.info}>
                  <Text weight="bold" numberOfLines={1}>
                    {item.storeName}
                  </Text>
                  <Text size="xs" color="muted" numberOfLines={1}>
                    {[item.storeCode, item.city ?? item.address].filter(Boolean).join(' · ')}
                  </Text>
                </View>
                {item.status !== 'ACTIVE' ? <Badge variant="warning">{item.status}</Badge> : null}
                {selected ? (
                  <View style={styles.check}>
                    <CheckIcon size={14} color={colors.white} strokeWidth={2.4} />
                  </View>
                ) : (
                  <ChevronRightIcon size={18} color={colors.gray[400]} />
                )}
              </PressableScale>
            </FadeInView>
          );
        }}
        ListEmptyComponent={
          storesStatus === 'loading' ? null : (
            <EmptyState
              icon={StoreIcon}
              title={query ? 'Toko tidak ditemukan' : 'Belum ada toko'}
              description={
                query ? 'Coba kata kunci lain.' : 'Toko baru muncul di sini setelah Kepala Toko mendaftar lewat aplikasi.'
              }
            />
          )
        }
        ListFooterComponent={
          !activeStore ? (
            <View style={styles.footer}>
              <Link onPress={() => dispatch(logout())}>Keluar dari akun</Link>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  hero: {
    marginHorizontal: spacing.lg,
    marginTop: spacing.md,
    padding: spacing.xl,
    borderRadius: radii['2xl'],
    overflow: 'hidden',
    backgroundColor: colors.darkBg,
  },
  eyebrow: { color: '#8FE0C2', letterSpacing: 1.6 },
  heroTitle: { color: colors.white, marginTop: spacing.xs },
  heroSub: { color: 'rgba(255,255,255,0.75)', marginTop: spacing.sm },
  search: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing['3xl'], gap: spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.xl,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardSelected: { borderColor: colors.primary[600], backgroundColor: colors.primary[50] },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: radii.lg,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSelected: { backgroundColor: colors.primary[600] },
  info: { flex: 1, gap: 2 },
  check: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { alignItems: 'center', paddingTop: spacing.xl },
});
