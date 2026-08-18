import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import type { AuthStackParamList } from '@/navigation/types';
import { colors, radii, spacing } from '@/theme';
import { Button, FormControl, Input, Link, PasswordInput } from '@/components/ui/forms';
import { Heading, Text } from '@/components/ui/typography';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.auth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const isSubmitting = status === 'authenticating';

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <View style={styles.logoMark}>
            <Text size="xl">🏪</Text>
          </View>
          <Text weight="bold" size="lg">
            cassier-Q
          </Text>
        </View>

        <Heading level="h1" style={styles.title}>
          Masuk
        </Heading>
        <Text color="secondary" style={styles.subtitle}>
          Masuk ke akun toko kamu untuk mulai berjualan hari ini
        </Text>

        <FormControl label="Username" helperText="Username yang dipakai waktu daftar toko">
          <Input
            placeholder="Masukkan username"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />
        </FormControl>

        <FormControl label="Kata Sandi" errorText={error ?? undefined} isInvalid={!!error}>
          <PasswordInput placeholder="Masukkan kata sandi" value={password} onChangeText={setPassword} />
        </FormControl>

        <View style={styles.forgot}>
          <Link onPress={() => navigation.navigate('ForgotPassword')}>Lupa kata sandi?</Link>
        </View>

        <Button
          onPress={() => dispatch(login({ username, password }))}
          loading={isSubmitting}
          disabled={!username || !password}
          fullWidth
        >
          Masuk
        </Button>

        <View style={styles.registerLink}>
          <Text color="secondary" size="sm">
            Belum punya akun?{' '}
          </Text>
          <Link onPress={() => navigation.navigate('Register')}>Daftar</Link>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing['2xl'] },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing['2xl'] },
  forgot: { alignItems: 'flex-end', marginBottom: spacing.base },
  registerLink: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
});
