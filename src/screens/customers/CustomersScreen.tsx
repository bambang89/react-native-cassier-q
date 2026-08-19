import { useEffect, useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { createCustomer, fetchCustomers, updateCustomer } from '@/store/slices/customersSlice';
import { fetchStoreProfile } from '@/store/slices/storeProfileSlice';
import { useResponsive } from '@/hooks/useResponsive';
import type { MainTabParamList, RootStackParamList } from '@/navigation/types';
import type { Customer } from '@/types/models';
import { colors, spacing } from '@/theme';
import { tabletColors } from '@/theme/tabletColors';
import { Button, FormControl, Input } from '@/components/ui/forms';
import { Badge } from '@/components/ui/dataDisplay';
import { Modal } from '@/components/ui/overlay';
import { Card, EmptyState, Header, SplitItem, TabletSplitView, TabletTopBar } from '@/components/ui/recipes';
import { CreditCardIcon, PeopleIcon, SearchIcon } from '@/components/icons/LineIcons';
import { Text } from '@/components/ui/typography';
import { CustomerDetailContent } from './CustomerDetailScreen';

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Customers'>,
  NativeStackScreenProps<RootStackParamList>
>;

export default function CustomersScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { isTabletLandscape } = useResponsive();
  const { items, status } = useAppSelector((state) => state.customers);
  const user = useAppSelector((state) => state.auth.user);
  const storeProfile = useAppSelector((state) => state.storeProfile.profile);
  const [search, setSearch] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  useEffect(() => {
    dispatch(fetchCustomers());
    dispatch(fetchStoreProfile());
  }, [dispatch]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        (c.phone ?? '').toLowerCase().includes(q),
    );
  }, [items, search]);

  const totalDebt = useMemo(() => items.reduce((sum, c) => sum + Math.max(0, c.balance), 0), [items]);

  useEffect(() => {
    if (isTabletLandscape && !selectedCustomerId && items.length > 0) {
      setSelectedCustomerId(items[0].id);
    }
  }, [isTabletLandscape, items, selectedCustomerId]);

  const primaryRole = user?.roles?.[0] ?? null;
  const storeName = storeProfile?.storeName ?? primaryRole?.storeName ?? '-';

  if (isTabletLandscape) {
    return (
      <SafeAreaView style={[styles.container, styles.containerTablet]} edges={['top', 'left', 'right']}>
        <TabletTopBar
          title="Pelanggan"
          subtitle={`${items.length} pelanggan · Rp ${totalDebt.toLocaleString('id-ID')} piutang`}
          storeName={storeName}
          userName={user?.name ?? 'Kasir'}
          rightAction={
            <Button size="sm" style={{ backgroundColor: tabletColors.blue600 }} onPress={() => setFormVisible(true)}>
              + Baru
            </Button>
          }
        />
        <TabletSplitView
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Cari pelanggan"
          detail={
            selectedCustomerId ? (
              <CustomerDetailContent key={selectedCustomerId} customerId={selectedCustomerId} />
            ) : (
              <View style={styles.detailEmpty}>
                <Text color="muted">Pilih pelanggan di daftar untuk melihat detail.</Text>
              </View>
            )
          }
        >
          {filtered.map((item) => (
            <SplitItem
              key={item.id}
              active={item.id === selectedCustomerId}
              onPress={() => setSelectedCustomerId(item.id)}
              title={item.name}
              amount={item.balance > 0 ? `Rp ${item.balance.toLocaleString('id-ID')}` : undefined}
              meta={`${item.customerCode}${item.phone ? ` · ${item.phone}` : ''}`}
            />
          ))}
        </TabletSplitView>

        <Modal isOpen={formVisible} onClose={() => setFormVisible(false)}>
          <CustomerForm onDone={() => setFormVisible(false)} onCancel={() => setFormVisible(false)} />
        </Modal>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <Header
        title="Pelanggan"
        subtitle="Kelola data & piutang pelanggan"
        rightElement={
          <Button size="sm" onPress={() => setFormVisible(true)}>
            + Baru
          </Button>
        }
      />

      {items.length > 0 ? (
        <View style={styles.summaryBanner}>
          <CreditCardIcon size={18} color={colors.primary[600]} />
          <Text size="sm" weight="semibold" style={styles.summaryText}>
            Total piutang dari {items.filter((c) => c.balance > 0).length} pelanggan: {' '}
            <Text weight="bold" color={totalDebt > 0 ? 'error' : 'secondary'}>
              Rp {totalDebt.toLocaleString('id-ID')}
            </Text>
          </Text>
        </View>
      ) : null}

      <View style={styles.searchBar}>
        <Input
          placeholder="Cari nama, kode, atau no. HP..."
          value={search}
          onChangeText={setSearch}
          returnKeyType="search"
          leftElement={<SearchIcon size={16} color={colors.text.muted} />}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        onRefresh={() => dispatch(fetchCustomers())}
        refreshing={status === 'loading'}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <Card
            shadow="none"
            style={styles.card}
            onPress={() => navigation.navigate('CustomerDetail', { customerId: item.id })}
          >
            <View style={styles.row}>
              <View style={styles.avatar}>
                <Text weight="bold" color="inverse">
                  {item.name.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.info}>
                <Text weight="semibold" numberOfLines={1}>
                  {item.name}
                </Text>
                <Text size="xs" color="secondary">
                  {item.customerCode}
                  {item.phone ? ` · ${item.phone}` : ''}
                </Text>
              </View>
              <Badge variant={item.balance > 0 ? 'error' : 'success'}>
                {item.balance > 0 ? `Utang Rp ${item.balance.toLocaleString('id-ID')}` : 'Lunas'}
              </Badge>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          status === 'loading' ? (
            <Text color="muted" align="center" style={styles.empty}>
              Memuat pelanggan...
            </Text>
          ) : search ? (
            <EmptyState
              icon={SearchIcon}
              title="Tidak Ditemukan"
              description={`Tidak ada pelanggan yang cocok dengan "${search}".`}
            />
          ) : (
            <EmptyState
              icon={PeopleIcon}
              title="Belum Ada Pelanggan"
              description="Daftarkan pelanggan langganan supaya bisa mencatat penjualan bon/utang di kasir."
              actionLabel="+ Tambah Pelanggan"
              onAction={() => setFormVisible(true)}
            />
          )
        }
      />

      <Modal isOpen={formVisible} onClose={() => setFormVisible(false)}>
        <CustomerForm onDone={() => setFormVisible(false)} onCancel={() => setFormVisible(false)} />
      </Modal>
    </View>
  );
}

export function CustomerForm({
  customer,
  onDone,
  onCancel,
}: {
  customer?: Customer;
  onDone: () => void;
  onCancel: () => void;
}) {
  const dispatch = useAppDispatch();
  const [customerCode, setCustomerCode] = useState(customer?.customerCode ?? '');
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [address, setAddress] = useState(customer?.address ?? '');
  const [creditLimit, setCreditLimit] = useState(customer ? String(customer.creditLimit) : '');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      const payload = {
        customerCode,
        name,
        phone: phone || undefined,
        address: address || undefined,
        creditLimit: creditLimit ? Number(creditLimit) : undefined,
      };
      if (customer) {
        await dispatch(updateCustomer({ id: customer.id, payload })).unwrap();
      } else {
        await dispatch(createCustomer(payload)).unwrap();
      }
      onDone();
    } catch {
      Alert.alert('Gagal', 'Data pelanggan tidak bisa disimpan.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text weight="semibold" size="lg" style={styles.modalTitle}>
        {customer ? 'Ubah Pelanggan' : 'Pelanggan Baru'}
      </Text>
      <FormControl label="Kode pelanggan" isRequired helperText="mis. CUST-001">
        <Input value={customerCode} onChangeText={setCustomerCode} placeholder="mis. CUST-001" autoCapitalize="characters" />
      </FormControl>
      <FormControl label="Nama" isRequired>
        <Input value={name} onChangeText={setName} placeholder="Nama pelanggan" />
      </FormControl>
      <FormControl label="No. HP">
        <Input value={phone} onChangeText={setPhone} placeholder="Opsional" keyboardType="phone-pad" />
      </FormControl>
      <FormControl label="Alamat">
        <Input value={address} onChangeText={setAddress} placeholder="Opsional" />
      </FormControl>
      <FormControl
        label="Limit kredit (utang maksimal)"
        helperText="Kosongkan kalau tidak mau membatasi jumlah utang pelanggan ini"
      >
        <Input value={creditLimit} onChangeText={setCreditLimit} placeholder="0" keyboardType="numeric" />
      </FormControl>
      <View style={styles.modalActions}>
        <Button variant="ghost" onPress={onCancel} style={styles.modalAction}>
          Batal
        </Button>
        <Button onPress={onSubmit} loading={submitting} disabled={!customerCode || !name} style={styles.modalAction}>
          Simpan
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  containerTablet: { backgroundColor: tabletColors.gray25 },
  detailEmpty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.base,
    marginBottom: spacing.sm,
    padding: spacing.sm + 2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  summaryText: { flex: 1 },
  searchBar: { paddingHorizontal: spacing.base, marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.base, paddingBottom: spacing['2xl'] },
  card: { marginBottom: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.teal[700],
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: { flex: 1 },
  empty: { marginTop: spacing['3xl'] },
  modalTitle: { marginBottom: spacing.base },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { minWidth: 90 },
});
