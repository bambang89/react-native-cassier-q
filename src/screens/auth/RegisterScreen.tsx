import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { register } from '../../store/slices/authSlice';
import type { AuthStackParamList } from '../../navigation/types';
import { spacing } from '../../theme';
import { Button, FormControl, Input, Link } from '../../components/ui/forms';
import { Heading, Text } from '../../components/ui/typography';

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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Heading level="h2" align="center" style={styles.title}>
          Daftar Toko
        </Heading>
        <Text color="secondary" align="center" style={styles.subtitle}>
          Sekali daftar, akun pemilik toko langsung dibuat
        </Text>

        <FormControl label="Kode toko" isRequired>
          <Input placeholder="mis. TOKO001" autoCapitalize="characters" value={storeCode} onChangeText={setStoreCode} />
        </FormControl>
        <FormControl label="Nama toko" isRequired>
          <Input placeholder="Nama toko" value={storeName} onChangeText={setStoreName} />
        </FormControl>
        <FormControl label="Username" isRequired>
          <Input placeholder="username" autoCapitalize="none" autoCorrect={false} value={username} onChangeText={setUsername} />
        </FormControl>
        <FormControl label="Nama lengkap" isRequired>
          <Input placeholder="Nama lengkap" value={name} onChangeText={setName} />
        </FormControl>
        <FormControl label="Email" isRequired>
          <Input
            placeholder="Email"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />
        </FormControl>
        <FormControl
          label="Kata sandi"
          isRequired
          helperText="Minimal 8 karakter"
          errorText={error ?? undefined}
          isInvalid={!!error}
        >
          <Input placeholder="Kata sandi" secureTextEntry value={password} onChangeText={setPassword} />
        </FormControl>

        <Button onPress={onSubmit} loading={isSubmitting} disabled={!canSubmit} fullWidth style={styles.submit}>
          Daftar
        </Button>

        <View style={styles.loginLink}>
          <Link onPress={() => navigation.goBack()}>Sudah punya akun? Masuk</Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: '#fff' },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  title: { marginBottom: spacing.xs },
  subtitle: { marginBottom: spacing['2xl'] },
  submit: { marginTop: spacing.sm },
  loginLink: { alignItems: 'center', marginTop: spacing.lg },
});
