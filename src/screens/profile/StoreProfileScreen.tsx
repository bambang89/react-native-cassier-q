import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { fetchStoreProfile, updateStoreProfile } from '@/store/slices/storeProfileSlice';
import { colors, spacing } from '@/theme';
import { Button, FormControl, Input } from '@/components/ui/forms';
import { Badge } from '@/components/ui/dataDisplay';
import { Card, Header } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';

export default function StoreProfileScreen() {
  const dispatch = useAppDispatch();
  const { profile, status, updateStatus } = useAppSelector((state) => state.storeProfile);

  const [storeName, setStoreName] = useState('');
  const [address, setAddress] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    dispatch(fetchStoreProfile());
  }, [dispatch]);

  // Isi form begitu profil datang dari server (bukan initial useState — data
  // belum ada saat komponen pertama render).
  useEffect(() => {
    if (!profile) return;
    setStoreName(profile.storeName ?? '');
    setAddress(profile.address ?? '');
    setProvince(profile.province ?? '');
    setCity(profile.city ?? '');
    setPhone(profile.phone ?? '');
  }, [profile]);

  const onSave = async () => {
    try {
      await dispatch(
        updateStoreProfile({
          storeName,
          address: address || undefined,
          province: province || undefined,
          city: city || undefined,
          phone: phone || undefined,
        }),
      ).unwrap();
      Alert.alert('Berhasil', 'Profil toko sudah disimpan.');
    } catch {
      Alert.alert('Gagal', 'Profil toko tidak bisa disimpan, coba lagi.');
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Outlet" subtitle="Profil & data toko" />

      {status === 'loading' && !profile ? (
        <Text color="muted" align="center" style={styles.loading}>
          Memuat profil toko...
        </Text>
      ) : (
        <ScrollView contentContainerStyle={styles.body}>
          {profile ? (
            <Card style={styles.identityCard}>
              <View style={styles.identityRow}>
                <Text weight="semibold" size="lg">
                  {profile.storeCode}
                </Text>
                <View style={styles.badges}>
                  {profile.headOffice ? <Badge variant="primary">Kantor Pusat</Badge> : null}
                  <Badge variant={profile.status === 'ACTIVE' ? 'success' : 'neutral'}>{profile.status}</Badge>
                </View>
              </View>
              <Text size="xs" color="muted" style={styles.identityHint}>
                Kode toko & status ditetapkan sistem, tidak bisa diubah dari sini.
              </Text>
            </Card>
          ) : null}

          <FormControl label="Nama toko" isRequired>
            <Input value={storeName} onChangeText={setStoreName} placeholder="Nama toko" />
          </FormControl>
          <FormControl label="Alamat">
            <Input value={address} onChangeText={setAddress} placeholder="Opsional" />
          </FormControl>
          <FormControl label="Provinsi">
            <Input value={province} onChangeText={setProvince} placeholder="Opsional" />
          </FormControl>
          <FormControl label="Kota">
            <Input value={city} onChangeText={setCity} placeholder="Opsional" />
          </FormControl>
          <FormControl label="Telepon">
            <Input value={phone} onChangeText={setPhone} placeholder="Opsional" keyboardType="phone-pad" />
          </FormControl>

          <Text size="xs" color="muted" style={styles.footerHint}>
            Nama, alamat, dan telepon di sini dipakai sebagai kop struk (lihat layar Struk).
          </Text>

          <Button onPress={onSave} loading={updateStatus === 'loading'} disabled={!storeName} fullWidth>
            Simpan
          </Button>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  loading: { marginTop: spacing['3xl'] },
  body: { padding: spacing.base, paddingBottom: spacing['3xl'] },
  identityCard: { marginBottom: spacing.lg },
  identityRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  badges: { flexDirection: 'row', gap: spacing.xs },
  identityHint: { marginTop: spacing.xs },
  footerHint: { marginBottom: spacing.base },
});
