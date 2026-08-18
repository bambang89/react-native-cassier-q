import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch } from '@/store/hooks';
import { resetPassword } from '@/store/slices/authSlice';
import type { AuthStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { Button, FormControl, Input, PasswordInput } from '@/components/ui/forms';
import { AppBar } from '@/components/ui/recipes';
import { Heading, Text } from '@/components/ui/typography';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const passwordsMatch = !confirmPassword || confirmPassword === newPassword;
  const canSubmit = !!token && newPassword.length >= 8 && confirmPassword.length >= 8 && passwordsMatch;

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await dispatch(resetPassword({ token, newPassword })).unwrap();
      Alert.alert('Berhasil', 'Kata sandi sudah diganti, silakan masuk.', [
        { text: 'OK', onPress: () => navigation.navigate('Login') },
      ]);
    } catch {
      Alert.alert('Gagal', 'Token tidak valid/kedaluwarsa, atau kata sandi tidak memenuhi syarat.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppBar title="Reset Kata Sandi" onBack={navigation.goBack} />
      <View style={styles.body}>
        <Text style={styles.icon}>🔑</Text>
        <Heading level="h1" style={styles.title}>
          Buat kata sandi baru
        </Heading>
        <Text color="secondary" style={styles.description}>
          Tempel token reset yang dikirim ke email toko, lalu masukkan kata sandi baru.
        </Text>
        <FormControl label="Token reset">
          <Input placeholder="Token" autoCapitalize="none" autoCorrect={false} value={token} onChangeText={setToken} />
        </FormControl>
        <FormControl label="Kata sandi baru" helperText="Minimal 8 karakter">
          <PasswordInput placeholder="Kata sandi baru" value={newPassword} onChangeText={setNewPassword} />
        </FormControl>
        <FormControl
          label="Konfirmasi kata sandi baru"
          errorText={!passwordsMatch ? 'Kata sandi tidak sama' : undefined}
          isInvalid={!passwordsMatch}
        >
          <PasswordInput placeholder="Ulangi kata sandi baru" value={confirmPassword} onChangeText={setConfirmPassword} />
        </FormControl>
        <Button onPress={onSubmit} loading={submitting} disabled={!canSubmit} fullWidth>
          Ganti Kata Sandi
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  body: { padding: spacing.xl },
  icon: { fontSize: 40, marginBottom: spacing.base },
  title: { marginBottom: spacing.xs },
  description: { marginBottom: spacing.xl },
});
