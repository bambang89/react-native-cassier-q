import { useEffect, useRef, useState } from 'react';
import { Animated, StatusBar, StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { useFonts } from 'expo-font';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';

import { setupSslPinning } from './src/api/sslPinning';
import { AnimatedSplash } from './src/components/splash/AnimatedSplash';
import { lockOrientationForDevice } from './src/config/orientation';
import RootNavigator from './src/navigation/RootNavigator';
import { initNotifications } from './src/services/notifications';
import { store } from './src/store';
import { useAppDispatch, useAppSelector } from './src/store/hooks';
import { bootstrapAuth } from './src/store/slices/authSlice';

// Splash native (navy polos) ditahan sampai AnimatedSplash menggambar frame
// pertamanya — tanpa ini ada kedipan putih di antara keduanya.
SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ fade: false });

export default function App() {
  const [pinningReady, setPinningReady] = useState(false);
  // Satu keluarga font untuk seluruh app — lihat src/theme/typography.ts.
  const [fontsLoaded] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  useEffect(() => {
    Promise.all([
      setupSslPinning().catch((error) => console.error('[SSL Pinning] init failed', error)),
      lockOrientationForDevice(),
    ]).finally(() => setPinningReady(true));
  }, []);

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <Provider store={store}>
          <AppShell bootReady={pinningReady && fontsLoaded} fontsLoaded={fontsLoaded} />
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * App dirender di belakang splash begitu boot selesai (font + SSL pinning),
 * supaya cek sesi login berjalan selama animasi. Splash baru keluar setelah
 * status login jelas — tidak ada layar loading kedua setelah splash.
 */
const SPLASH_MAX_AUTH_WAIT_MS = 5000;

function AppShell({ bootReady, fontsLoaded }: { bootReady: boolean; fontsLoaded: boolean }) {
  const dispatch = useAppDispatch();
  const authStatus = useAppSelector((state) => state.auth.status);
  const [splashVisible, setSplashVisible] = useState(true);
  const [heavyPhaseDone, setHeavyPhaseDone] = useState(false);
  const [authWaitExpired, setAuthWaitExpired] = useState(false);
  const reveal = useRef(new Animated.Value(0)).current;
  const authResolved = authStatus !== 'idle' && authStatus !== 'checking';

  // Jaringan lambat jangan sampai menahan splash sampai timeout request (15 dtk):
  // setelah batas ini splash tetap keluar dan RootNavigator yang menampilkan loading.
  useEffect(() => {
    if (!heavyPhaseDone) return;
    const timer = setTimeout(() => setAuthWaitExpired(true), SPLASH_MAX_AUTH_WAIT_MS);
    return () => clearTimeout(timer);
  }, [heavyPhaseDone]);

  // Cek sesi login (ringan: baca token + 1 request) dimulai selama animasi,
  // sedangkan memasang navigator (berat) ditunda sampai animasi JS selesai.
  useEffect(() => {
    if (bootReady && authStatus === 'idle') dispatch(bootstrapAuth());
  }, [bootReady, authStatus, dispatch]);

  // Dialog izin notifikasi baru muncul setelah splash, bukan menimpanya.
  useEffect(() => {
    if (splashVisible) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    initNotifications()
      .then((unsubscribe) => (cancelled ? unsubscribe() : (cleanup = unsubscribe)))
      .catch((error) => console.warn('[notifications] init failed', error));
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [splashVisible]);

  return (
    <>
      {bootReady && heavyPhaseDone ? (
        <Animated.View
          style={[
            styles.flex,
            splashVisible && {
              transform: [{ scale: reveal.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1] }) }],
            },
          ]}
        >
          <RootNavigator />
          {!splashVisible ? <StatusBar barStyle="dark-content" /> : null}
        </Animated.View>
      ) : null}
      {splashVisible ? (
        <AnimatedSplash
          ready={bootReady && heavyPhaseDone && (authResolved || authWaitExpired)}
          fontsLoaded={fontsLoaded}
          reveal={reveal}
          onHeavyPhaseDone={() => setHeavyPhaseDone(true)}
          onFinish={() => setSplashVisible(false)}
        />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});
