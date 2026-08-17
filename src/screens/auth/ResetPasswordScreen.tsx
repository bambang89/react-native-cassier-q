import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch } from '@/store/hooks';
import { resetPassword } from '@/store/slices/authSlice';
import type { AuthStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { Button, FormControl, Input } from '@/components/ui/forms';
import { AppBar } from '@/components/ui/recipes';
import { Text } from '@/components/ui/typography';

type Props = NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = !!token && newPassword.length >= 8;

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
        <Text color="secondary" style={styles.description}>
          Tempel token reset yang dikirim ke email toko, lalu masukkan kata sandi baru.
        </Text>
        <FormControl label="Token reset">
          <Input placeholder="Token" autoCapitalize="none" autoCorrect={false} value={token} onChangeText={setToken} />
        </FormControl>
        <FormControl label="Kata sandi baru" helperText="Minimal 8 karakter">
          <Input placeholder="Kata sandi baru" secureTextEntry value={newPassword} onChangeText={setNewPassword} />
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
  description: { marginBottom: spacing.lg },
});
