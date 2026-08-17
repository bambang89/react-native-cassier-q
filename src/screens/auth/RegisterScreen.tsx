import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { register } from '@/store/slices/authSlice';
import type { AuthStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { Button, FormControl, Input, Link } from '@/components/ui/forms';
import { Heading, Text } from '@/components/ui/typography';

type Props = NativeStackScreenProps<AuthStackParamList, 'Register'>;

export default function RegisterScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.auth);
  const [storeCode, setStoreCode] = useState('');
  const [storeName, setStoreName] = useState('');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const isSubmitting = status === 'authenticating';
  const canSubmit = !!(storeCode && storeName && username && name && email && password.length >= 8);

  const onSubmit = () => {
    dispatch(register({ storeCode, storeName, username, name, email, password }));
  };

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.logoWrap}>
          <Text style={styles.logoEmoji}>📝</Text>
        </View>
        <Heading level="h2" align="center" style={styles.title}>
          Daftar Toko Baru
        </Heading>
        <Text color="secondary" align="center" style={styles.subtitle}>
          Isi data di bawah — akun pemilik toko langsung jadi begitu selesai daftar
        </Text>

        <Text weight="bold" style={styles.sectionLabel}>
          🏬 Data Toko
        </Text>
        <FormControl label="Kode toko" isRequired helperText="Kode singkat buat toko kamu, bebas kamu tentukan">
          <Input placeholder="mis. TOKO001" autoCapitalize="characters" value={storeCode} onChangeText={setStoreCode} />
        </FormControl>
        <FormControl label="Nama toko" isRequired>
          <Input placeholder="mis. Toko Kelontong Berkah" value={storeName} onChangeText={setStoreName} />
        </FormControl>

        <Text weight="bold" style={styles.sectionLabel}>
          👤 Data Pemilik
        </Text>
        <FormControl label="Nama lengkap" isRequired>
          <Input placeholder="Nama lengkap kamu" value={name} onChangeText={setName} />
        </FormControl>
        <FormControl label="Username" isRequired helperText="Dipakai untuk masuk/login nanti, bukan nama lengkap">
          <Input placeholder="mis. budi123" autoCapitalize="none" autoCorrect={false} value={username} onChangeText={setUsername} />
        </FormControl>
        <FormControl label="Email" isRequired>
          <Input
            placeholder="nama@email.com"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </FormControl>
        <FormControl
          label="Kata Sandi"
          isRequired
          helperText="Minimal 8 karakter — ingat baik-baik, dipakai tiap kali masuk"
          errorText={error ?? undefined}
          isInvalid={!!error}
        >
          <Input placeholder="Buat kata sandi" secureTextEntry value={password} onChangeText={setPassword} />
        </FormControl>

        <Button onPress={onSubmit} loading={isSubmitting} disabled={!canSubmit} fullWidth style={styles.submit}>
          Daftar
        </Button>

        <View style={styles.loginLink}>
          <Link onPress={() => navigation.goBack()}>Sudah punya akun? Masuk</Link>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  logoWrap: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  logoEmoji: { fontSize: 36 },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.xl, paddingHorizontal: spacing.base },
  sectionLabel: { marginBottom: spacing.sm, marginTop: spacing.xs },
  submit: { marginTop: spacing.sm },
  loginLink: { alignItems: 'center', marginTop: spacing.lg },
});
