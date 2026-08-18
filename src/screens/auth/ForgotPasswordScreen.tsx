import { useState } from 'react';
import { Alert, Image, StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch } from '@/store/hooks';
import { forgotPassword } from '@/store/slices/authSlice';
import type { AuthStackParamList } from '@/navigation/types';
import { colors, spacing } from '@/theme';
import { Button, FormControl, Input } from '@/components/ui/forms';
import { AppBar } from '@/components/ui/recipes';
import { Heading, Text } from '@/components/ui/typography';

type Props = NativeStackScreenProps<AuthStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const [username, setUsername] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    setSubmitting(true);
    try {
      await dispatch(forgotPassword(username)).unwrap();
      Alert.alert(
        'Terkirim',
        'Kalau username terdaftar, token reset sudah dikirim ke email toko.',
        [{ text: 'OK', onPress: () => navigation.navigate('ResetPassword') }],
      );
    } catch {
      Alert.alert('Gagal', 'Tidak bisa memproses permintaan, coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppBar title="Lupa Kata Sandi" onBack={navigation.goBack} />
      <View style={styles.body}>
        <Image
          source={require('@/assets/branding/cassier-q-symbol.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Heading level="h4" align="center" style={styles.title}>
          Lupa kata sandi?
        </Heading>
        <Text color="secondary" align="center" style={styles.description}>
          Jangan khawatir, ini bisa terjadi ke siapa saja. Masukkan username akun kamu — kalau terdaftar, token
          reset kata sandi akan dikirim ke email toko.
        </Text>
        <FormControl label="Email atau Username">
          <Input placeholder="nama@bisnis.com" autoCapitalize="none" autoCorrect={false} value={username} onChangeText={setUsername} />
        </FormControl>
        <Button onPress={onSubmit} loading={submitting} disabled={!username} fullWidth>
          Kirim Token Reset
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    backgroundColor: colors.background 
  },
  body: { 
    width: '100%',
    maxWidth: 500,
    alignSelf: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl 
  },
  logo: { width: 56, height: 56, alignSelf: 'center', marginBottom: spacing.base },
  title: { marginBottom: spacing.xs },
  description: { marginBottom: spacing.xl },
});
