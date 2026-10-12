import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { useAppDispatch } from '@/store/hooks';
import { createCustomer, updateCustomer } from '@/store/slices/customersSlice';
import type { Customer } from '@/types/models';
import { spacing } from '@/theme';
import { Button, FormControl, Input } from '@/components/ui/forms';
import { Text } from '@/components/ui/typography';

// File sendiri (bukan di CustomersScreen) supaya CustomersScreen ↔
// CustomerDetailScreen tidak saling import (require cycle).
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
  modalTitle: { marginBottom: spacing.base },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.sm },
  modalAction: { minWidth: 90 },
});
