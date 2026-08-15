import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import type { AuthStackParamList } from '@/navigation/types';
import { spacing } from '@/theme';
import { Button, FormControl, Input, Link } from '@/components/ui/forms';
import { Heading, Text } from '@/components/ui/typography';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.auth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const isSubmitting = status === 'authenticating';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Heading level="h1" align="center">
          cassier-Q
        </Heading>
        <Text color="secondary" align="center" style={styles.subtitle}>
          Masuk untuk mulai berjualan
        </Text>

        <FormControl label="Username">
          <Input
            placeholder="username"
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
          />
        </FormControl>

        <FormControl label="Kata sandi" errorText={error ?? undefined} isInvalid={!!error}>
          <Input
            placeholder="Kata sandi"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
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
          <Link onPress={() => navigation.navigate('Register')}>Belum punya akun? Daftar</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  subtitle: { marginTop: spacing.xs, marginBottom: spacing['2xl'] },
  forgot: { alignItems: 'flex-end', marginBottom: spacing.base },
  registerLink: { alignItems: 'center', marginTop: spacing.lg },
});
