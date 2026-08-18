import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { register } from '@/store/slices/authSlice';
import type { AuthStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { Button, FormControl, Input, Link, PasswordInput } from '@/components/ui/forms';
import { Heading, Text } from '@/components/ui/typography';
import { HStack } from '@/components/ui/layout';

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
  const [confirmPassword, setConfirmPassword] = useState('');

  const isSubmitting = status === 'authenticating';
  const passwordsMatch = !confirmPassword || confirmPassword === password;
  const canSubmit = !!(
    storeCode &&
    storeName &&
    username &&
    name &&
    email &&
    password.length >= 8 &&
    confirmPassword.length >= 8 &&
    passwordsMatch
  );

  const onSubmit = () => {
    dispatch(register({ storeCode, storeName, username, name, email, password }));
  };

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image
          source={require('@/assets/branding/cassier-q-symbol.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Heading level="h4" align="center" style={styles.title}>
          Daftar Toko Baru
        </Heading>
        <Text color="secondary" align="center" style={styles.subtitle}>
          Isi data di bawah — akun pemilik toko langsung jadi begitu selesai daftar
        </Text>

        <Text weight="bold" style={styles.sectionLabel}>
          🏬 Data Toko
        </Text>
        <HStack space="md">
          <View style={styles.half}>
            <FormControl label="Kode toko" isRequired helperText="Bebas kamu tentukan">
              <Input placeholder="mis. TOKO001" autoCapitalize="characters" value={storeCode} onChangeText={setStoreCode} />
            </FormControl>
          </View>
          <View style={styles.half}>
            <FormControl label="Nama toko" isRequired>
              <Input placeholder="mis. Toko Berkah" value={storeName} onChangeText={setStoreName} />
            </FormControl>
          </View>
        </HStack>

        <Text weight="bold" style={styles.sectionLabel}>
          👤 Data Pemilik
        </Text>
        <HStack space="md">
          <View style={styles.half}>
            <FormControl label="Nama lengkap" isRequired>
              <Input placeholder="Nama lengkap kamu" value={name} onChangeText={setName} />
            </FormControl>
          </View>
          <View style={styles.half}>
            <FormControl label="Username" isRequired helperText="Buat login, bukan nama">
              <Input placeholder="mis. budi123" autoCapitalize="none" autoCorrect={false} value={username} onChangeText={setUsername} />
            </FormControl>
          </View>
        </HStack>
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
          <PasswordInput placeholder="Buat kata sandi" value={password} onChangeText={setPassword} />
        </FormControl>
        <FormControl
          label="Konfirmasi Kata Sandi"
          isRequired
          errorText={!passwordsMatch ? 'Kata sandi tidak sama' : undefined}
          isInvalid={!passwordsMatch}
        >
          <PasswordInput placeholder="Ulangi kata sandi" value={confirmPassword} onChangeText={setConfirmPassword} />
        </FormControl>

        <Button onPress={onSubmit} loading={isSubmitting} disabled={!canSubmit} fullWidth style={styles.submit}>
          Daftar
        </Button>

        <View style={styles.loginLink}>
          <Text color="secondary" size="sm">
            Sudah punya akun?{' '}
          </Text>
          <Link onPress={() => navigation.goBack()}>Masuk</Link>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  logo: {
    width: 56,
    height: 56,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing.xl },
  sectionLabel: { marginBottom: spacing.sm, marginTop: spacing.xs },
  half: { flex: 1 },
  submit: { marginTop: spacing.sm },
  loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
});
