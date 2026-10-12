import { useEffect, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { login } from '@/store/slices/authSlice';
import { clearRememberedUsername, loadRememberedUsername, saveRememberedUsername } from '@/api/tokenStorage';
import { useResponsive } from '@/hooks/useResponsive';
import type { AuthStackParamList } from '@/navigation/types';
import { colors, radii, spacing, staggerDelay } from '@/theme';
import { tabletColors } from '@/theme/tabletColors';
import { Button, CheckBox, FormControl, Input, Link, PasswordInput } from '@/components/ui/forms';
import { Divider } from '@/components/ui/dataDisplay';
import { Heading, Text } from '@/components/ui/typography';
import { GoogleIcon } from '@/components/icons/GoogleIcon';
import { CheckIcon } from '@/components/icons/LineIcons';
import { FadeInView } from '@/components/ui/motion';
import { GradientBackground } from '@/components/ui/recipes';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

export default function LoginScreen({ navigation }: Props) {
  const dispatch = useAppDispatch();
  const { isTabletLandscape } = useResponsive();
  const { status, error } = useAppSelector((state) => state.auth);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);

  const isSubmitting = status === 'authenticating';

  useEffect(() => {
    loadRememberedUsername().then((remembered) => {
      if (remembered) setUsername(remembered);
    });
  }, []);

  const handleLogin = async () => {
    const result = await dispatch(login({ username, password }));
    if (login.fulfilled.match(result)) {
      if (rememberMe) {
        await saveRememberedUsername(username);
      } else {
        await clearRememberedUsername();
      }
    }
  };

  const form = (
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <FadeInView fromScale={0.6} offsetY={0} duration={520}>
          <Image
            source={require('@/assets/branding/cassier-q-symbol.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </FadeInView>

        <FadeInView delay={120}>
          <Heading level="h4" align="center" style={styles.title}>
            Selamat datang kembali
          </Heading>
          <Text color="secondary" align="center" style={styles.subtitle}>
            Masuk untuk mengelola bisnis Anda.
          </Text>
        </FadeInView>

        <FadeInView delay={220}>
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
          onPress={handleLogin}
          loading={isSubmitting}
          disabled={!username || !password}
          fullWidth
          style={isTabletLandscape ? { backgroundColor: tabletColors.blue600 } : undefined}
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
        </FadeInView>
      </ScrollView>
  );

  return (
    <SafeAreaView style={styles.flex} edges={isTabletLandscape ? [] : undefined}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {isTabletLandscape ? (
          <View style={styles.split}>
            <BrandPanel />
            <View style={styles.flex}>{form}</View>
          </View>
        ) : (
          form
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const HIGHLIGHTS = [
  'Kasir cepat dengan scan barcode & struk Bluetooth',
  'Stok, pelanggan, dan utang tercatat otomatis',
  'Laporan penjualan harian dalam satu layar',
];

/** Panel brand di sisi kiri layar login tablet. */
function BrandPanel() {
  return (
    <View style={styles.brandPanel}>
      <GradientBackground colors={[colors.darkBg, '#123E7A', colors.primary[600]]} />
      <View style={styles.brandGlow} />
      <FadeInView offsetX={-24} offsetY={0} duration={600}>
        <Text weight="bold" style={styles.brandEyebrow}>
          CASSIER-Q
        </Text>
        <Text style={styles.brandHeadline}>Kasir pintar untuk bisnis yang terus bertumbuh.</Text>
      </FadeInView>
      <View style={styles.brandList}>
        {HIGHLIGHTS.map((item, index) => (
          <FadeInView key={item} delay={staggerDelay(index, 300)} offsetX={-16} offsetY={0}>
            <View style={styles.brandItem}>
              <View style={styles.brandCheck}>
                <CheckIcon size={14} color={colors.white} strokeWidth={2.4} />
              </View>
              <Text style={styles.brandItemLabel}>{item}</Text>
            </View>
          </FadeInView>
        ))}
      </View>
    </View>
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
  split: { flex: 1, flexDirection: 'row' },
  brandPanel: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing['4xl'],
    backgroundColor: colors.darkBg,
    overflow: 'hidden',
  },
  brandGlow: {
    position: 'absolute',
    right: -120,
    bottom: -140,
    width: 380,
    height: 380,
    borderRadius: 190,
    backgroundColor: 'rgba(96,165,250,0.18)',
  },
  brandEyebrow: { color: '#8FE0C2', letterSpacing: 2, fontSize: 13 },
  brandHeadline: {
    marginTop: spacing.md,
    color: colors.white,
    fontSize: 34,
    lineHeight: 44,
    fontFamily: 'Poppins_700Bold',
    maxWidth: 440,
  },
  brandList: { marginTop: spacing['2xl'], gap: spacing.base },
  brandItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  brandCheck: {
    width: 26,
    height: 26,
    borderRadius: radii.full,
    backgroundColor: 'rgba(16,185,129,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandItemLabel: { color: 'rgba(255,255,255,0.88)', fontSize: 15, flexShrink: 1 },
  registerLink: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.lg },
});
