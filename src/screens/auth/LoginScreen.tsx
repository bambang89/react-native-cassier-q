import { useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import type { AuthStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { Button, CheckBox, FormControl, Input, Link, PasswordInput } from '@/components/ui/forms';
import { Divider } from '@/components/ui/dataDisplay';
import { Heading, Text } from '@/components/ui/typography';
import { GoogleIcon } from '@/components/icons/GoogleIcon';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { status, error } = useAppSelector((state) => state.auth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const isSubmitting = status === 'authenticating';

  return (
    <SafeAreaView style={styles.flex}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Image
          source={require('@/assets/branding/cassier-q-symbol.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <Heading level="h4" align="center" style={styles.title}>
          Selamat datang kembali
        </Heading>
        <Text color="secondary" align="center" style={styles.subtitle}>
          Masuk untuk mengelola bisnis Anda.
        </Text>

        <FormControl label="Email atau Username">
          <Input
            placeholder="nama@bisnis.com"
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="none"
            value={username}
            onChangeText={setUsername}
          />
        </FormControl>

        <FormControl label="Password" errorText={error ?? undefined} isInvalid={!!error}>
          <PasswordInput placeholder="Password" value={password} onChangeText={setPassword} />
        </FormControl>

        <View style={styles.optionsRow}>
          <CheckBox value={rememberMe} onChange={setRememberMe} label="Ingat saya" />
          <Link onPress={() => navigation.navigate('ForgotPassword')}>Lupa password?</Link>
        </View>

        <Button
          onPress={() => dispatch(login({ username, password }))}
          loading={isSubmitting}
          disabled={!username || !password}
          fullWidth
        >
          Masuk
        </Button>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine}>
            <Divider />
          </View>
          <Text size="sm" color="muted" style={styles.dividerLabel}>
            ATAU
          </Text>
          <View style={styles.dividerLine}>
            <Divider />
          </View>
        </View>

        <Button variant="outline" fullWidth leftIcon={<GoogleIcon />} onPress={() => {}}>
          Masuk dengan Google
        </Button>

        <View style={styles.registerLink}>
          <Text color="secondary" size="sm">
            Belum punya akun?{' '}
          </Text>
          <Link onPress={() => navigation.navigate('Register')}>Daftar sekarang</Link>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  logo: {
    width: 56,
    height: 56,
    alignSelf: 'center',
    marginBottom: spacing.lg,
  },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing['2xl'] },
  optionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginVertical: spacing.lg,
  },
  dividerLine: { flex: 1 },
  dividerLabel: { flexShrink: 0 },
  registerLink: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
});
