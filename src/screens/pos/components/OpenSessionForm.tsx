import { useState } from 'react';
import { Alert, View } from 'react-native';

import { Button, FormControl, Input } from '@/components/ui/forms';
import { Text } from '@/components/ui/typography';
import { UnlockIcon } from '@/components/icons/LineIcons';
import { colors } from '@/theme';
import { useAppDispatch } from '@/store/hooks';
import { openSession } from '@/store/slices/cashierSessionSlice';

import { styles } from '../POSScreen.styles';

export function OpenSessionForm({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  const dispatch = useAppDispatch();
  const [openingCash, setOpeningCash] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    const parsed = Number(openingCash);
    if (Number.isNaN(parsed) || parsed < 0) return;
    setSubmitting(true);
    try {
      await dispatch(openSession(parsed)).unwrap();
      onDone();
    } catch {
      Alert.alert('Gagal', 'Sesi kasir tidak bisa dibuka.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View>
      <View style={styles.modalTitleRow}>
        <UnlockIcon size={17} color={colors.text.primary} />
        <Text weight="bold" size="lg">
          Buka Sesi Kasir
        </Text>
      </View>
      <Text color="secondary" size="sm" style={styles.openSessionHint}>
        Hitung dulu uang tunai yang ada di laci, lalu masukkan jumlahnya di bawah. Ini jadi patokan buat menghitung
        selisih kas saat sesi ditutup nanti.
      </Text>
      <FormControl label="Modal awal (kas di laci)" isRequired>
        <Input keyboardType="numeric" value={openingCash} onChangeText={setOpeningCash} placeholder="0" />
      </FormControl>
      <View style={styles.modalActions}>
        <Button variant="ghost" onPress={onCancel} style={styles.modalAction}>
          Batal
        </Button>
        <Button onPress={onSubmit} loading={submitting} disabled={!openingCash} style={styles.modalAction}>
          Buka
        </Button>
      </View>
    </View>
  );
}
