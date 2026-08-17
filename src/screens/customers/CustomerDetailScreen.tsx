import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchCustomerLedger, fetchCustomers, recordCustomerPayment } from '@/store/slices/customersSlice';
import type { RootStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { Button, FormControl, Input } from '@/components/ui/forms';
import { Badge, Divider } from '@/components/ui/dataDisplay';
import { Modal } from '@/components/ui/overlay';
import { AppBar, Card, EmptyState } from '@/components/ui/recipes';
import { Heading, Text } from '@/components/ui/typography';
import { CustomerForm } from './CustomersScreen';

type Props = NativeStackScreenProps<RootStackParamList, 'CustomerDetail'>;

export default function CustomerDetailScreen({ navigation, route }: Props) {
  const { customerId } = route.params;
  const dispatch = useAppDispatch();
  const customer = useAppSelector((state) => state.customers.items.find((c) => c.id === customerId));
  const listStatus = useAppSelector((state) => state.customers.status);
  const ledger = useAppSelector((state) => state.customers.ledgerByCustomerId[customerId]);
  const ledgerStatus = useAppSelector((state) => state.customers.ledgerStatusByCustomerId[customerId]);
  const [editVisible, setEditVisible] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);

  useEffect(() => {
    if (!customer && listStatus === 'idle') dispatch(fetchCustomers());
    dispatch(fetchCustomerLedger(customerId));
  }, [dispatch, customerId, customer, listStatus]);

  const reloadLedger = () => dispatch(fetchCustomerLedger(customerId));

  if (!customer) {
    return (
      <View style={styles.container}>
        <AppBar title="Pelanggan" onBack={navigation.goBack} />
        <View style={styles.center}>
          <Text color="muted">{listStatus === 'loading' ? 'Memuat...' : 'Pelanggan tidak ditemukan.'}</Text>
        </View>
      </View>
    );
  }

  const hasDebt = customer.balance > 0;

  return (
    <View style={styles.container}>
      <AppBar
        title={customer.name}
        onBack={navigation.goBack}
        rightElement={
          <Button size="sm" variant="outline" onPress={() => setEditVisible(true)}>
            Ubah
          </Button>
        }
      />

      <ScrollView contentContainerStyle={styles.body}>
        <Card>
          <View style={styles.identityRow}>
            <View style={styles.avatar}>
              <Text weight="bold" size="xl" color="inverse">
                {customer.name.charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.identityInfo}>
              <Text weight="bold" size="lg">
                {customer.name}
              </Text>
              <Text size="sm" color="secondary">
                {customer.customerCode}
                {customer.phone ? ` · ${customer.phone}` : ''}
              </Text>
              {customer.address ? (
                <Text size="xs" color="muted" numberOfLines={2} style={styles.address}>
                  📍 {customer.address}
                </Text>
              ) : null}
            </View>
          </View>
        </Card>

        <Card style={[styles.balanceCard, hasDebt ? styles.balanceCardDebt : styles.balanceCardClear]}>
          <Text size="sm" color="secondary">
            Sisa hutang saat ini
          </Text>
          <Heading level="h2" color={hasDebt ? 'danger' : 'primary'} style={styles.balanceValue}>
            Rp {customer.balance.toLocaleString('id-ID')}
          </Heading>
          {customer.creditLimit > 0 ? (
            <Text size="xs" color="muted" style={styles.creditLimitText}>
              Limit kredit: Rp {customer.creditLimit.toLocaleString('id-ID')}
            </Text>
          ) : null}
          <Button
            style={styles.paymentButton}
            disabled={!hasDebt}
            onPress={() => setPaymentVisible(true)}
          >
            {hasDebt ? '💵 Catat Pembayaran' : 'Tidak Ada Utang'}
          </Button>
        </Card>

        <Text weight="bold" size="lg" style={styles.sectionTitle}>
          📜 Riwayat
        </Text>
        <Card padding="none" shadow="sm">
          {!ledger || ledgerStatus === 'loading' ? (
            <View style={styles.emptyLedger}>
              <Text color="muted">Memuat riwayat...</Text>
            </View>
          ) : ledger.length === 0 ? (
            <View style={styles.emptyLedger}>
              <Text style={styles.emptyLedgerIcon}>🧾</Text>
              <Text color="secondary" align="center">
                Belum ada transaksi atau pembayaran tercatat untuk pelanggan ini.
              </Text>
            </View>
          ) : (
            ledger.map((entry, index) => (
              <View key={entry.id}>
                {index > 0 ? <Divider /> : null}
                <View style={styles.ledgerRow}>
                  <View style={styles.ledgerInfo}>
                    <Badge variant="neutral">{entry.entryType}</Badge>
                    <Text size="xs" color="secondary" style={styles.ledgerDate}>
                      {new Date(entry.createdAt).toLocaleString('id-ID')}
                      {entry.salesTransactionNumber ? ` · ${entry.salesTransactionNumber}` : ''}
                    </Text>
                    {entry.notes ? (
                      <Text size="xs" color="muted" numberOfLines={2}>
                        {entry.notes}
                      </Text>
                    ) : null}
                    {entry.createdByName ? (
                      <Text size="xs" color="muted">
                        oleh {entry.createdByName}
                      </Text>
                    ) : null}
                  </View>
                  <Text weight="bold">Rp {entry.amount.toLocaleString('id-ID')}</Text>
                </View>
              </View>
            ))
          )}
        </Card>
        {ledger && ledger.length > 0 ? (
          <Text size="xs" color="muted" style={styles.ledgerHint}>
            Urutan dari sistem, transaksi terbaru di atas. Saldo hutang di atas sudah dihitung otomatis oleh server.
          </Text>
        ) : null}
      </ScrollView>

      <Modal isOpen={editVisible} onClose={() => setEditVisible(false)}>
        <CustomerForm customer={customer} onDone={() => setEditVisible(false)} onCancel={() => setEditVisible(false)} />
      </Modal>

      <Modal isOpen={paymentVisible} onClose={() => setPaymentVisible(false)}>
        <RecordPaymentForm
          customerId={customer.id}
          customerName={customer.name}
          maxAmount={customer.balance}
          onDone={() => {
            setPaymentVisible(false);
            reloadLedger();
          }}
          onCancel={() => setPaymentVisible(false)}
        />
      </Modal>
    </View>
  );
}

function RecordPaymentForm({
  customerId,
  customerName,
  maxAmount,
  onDone,
  onCancel,
}: {
  customerId: string;
  customerName: string;
  maxAmount: number;
  onDone: () => void;
  onCancel: () => void;
}) {
  const dispatch = useAppDispatch();
  const [amount, setAmount] = useState(String(maxAmount));
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const parsed = Number(amount);
    if (Number.isNaN(parsed) || parsed <= 0) return;
    setSubmitting(true);
    try {
      await dispatch(recordCustomerPayment({ customerId, amount: parsed, notes: notes || undefined })).unwrap();
      onDone();
    } catch {
      Alert.alert('Gagal', 'Pembayaran tidak bisa dicatat.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <Text weight="semibold" size="lg" style={styles.modalTitle}>
        💵 Catat Pembayaran
      </Text>
      <Text color="secondary" size="sm" style={styles.paymentHint}>
        {customerName} melunasi sebagian/seluruh utangnya. Sisa utang saat ini: Rp {maxAmount.toLocaleString('id-ID')}.
      </Text>
      <FormControl label="Jumlah dibayar" isRequired>
        <Input keyboardType="numeric" value={amount} onChangeText={setAmount} />
      </FormControl>
      <FormControl label="Catatan (opsional)">
        <Input value={notes} onChangeText={setNotes} placeholder="mis. dibayar tunai di toko" />
      </FormControl>
      <View style={styles.modalActions}>
        <Button variant="ghost" onPress={onCancel} style={styles.modalAction}>
          Batal
        </Button>
        <Button onPress={onSubmit} loading={submitting} disabled={!amount} style={styles.modalAction}>
          Simpan
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  body: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  identityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  identityInfo: { flex: 1 },
  address: { marginTop: 2 },
  balanceCard: { alignItems: 'center', marginTop: spacing.md, borderWidth: 1.5 },
  balanceCardDebt: { borderColor: colors.error[200], backgroundColor: colors.error[50] },
  balanceCardClear: { borderColor: colors.success[200], backgroundColor: colors.success[50] },
  balanceValue: { marginTop: 2 },
  creditLimitText: { marginTop: spacing.xs },
  paymentButton: { marginTop: spacing.md, width: '100%' },
  sectionTitle: { marginTop: spacing.lg, marginBottom: spacing.sm },
  emptyLedger: { padding: spacing.xl, alignItems: 'center' },
  emptyLedgerIcon: { fontSize: 40, marginBottom: spacing.sm },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
    gap: spacing.sm,
  },
  ledgerInfo: { flex: 1, gap: 2 },
  ledgerDate: { marginTop: 2 },
  ledgerHint: { marginTop: spacing.sm },
  modalTitle: { marginBottom: spacing.base },
  paymentHint: { marginBottom: spacing.base },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { minWidth: 90 },
});
