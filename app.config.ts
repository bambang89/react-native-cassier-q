import type { ConfigContext, ExpoConfig } from 'expo/config';

import { androidGoogleServicesFile, iosGoogleServicesFile } from './plugins/firebaseFiles';

const API_ENV_NAMES = ['development', 'sit', 'uat', 'production'];

const VARIANT = process.env.APP_VARIANT ?? 'production';

const API_ENV = API_ENV_NAMES.includes(process.env.APP_ENV ?? '')
  ? process.env.APP_ENV
  : VARIANT === 'production'
    ? 'production'
    : VARIANT === 'preview'
      ? 'uat'
      : 'development';

const BUNDLE_ID: Record<string, string> = {
  development: 'com.cassierq.pos.dev',
  preview: 'com.cassierq.pos.preview',
  production: 'com.cassierq.pos',
};

// Firebase per platform hanya aktif kalau file konfigurasinya ada (dan, untuk
// Android, terdaftar untuk package variant ini) — lihat plugins/withFirebase.js.
const GOOGLE_SERVICES_JSON = androidGoogleServicesFile(BUNDLE_ID[VARIANT]);
const GOOGLE_SERVICE_INFO_PLIST = iosGoogleServicesFile();

const APP_NAME: Record<string, string> = {
  development: 'cassier-Q (Dev)',
  preview: 'cassier-Q (Preview)',
  production: 'cassier-Q',
};

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME[VARIANT],
  slug: 'cassier-Q',
  scheme: 'cassierq',
  version: '1.0.0',
  // HP = portrait, tablet = landscape. Dikunci saat runtime oleh
  // src/config/orientation.ts (expo-screen-orientation) sesuai jenis device.
  orientation: 'default',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    requireFullScreen: true,
    bundleIdentifier: BUNDLE_ID[VARIANT],
    googleServicesFile: GOOGLE_SERVICE_INFO_PLIST ?? undefined,
    icon: {
      light: './assets/icon-light.png',
      dark: './assets/icon-dark.png',
    },
    infoPlist: {
      NSCameraUsageDescription:
        'cassier-Q needs camera access to scan product barcodes at checkout.',
      NSMicrophoneUsageDescription:
        'cassier-Q does not record audio; this permission is required by the camera module.',
      NSBluetoothAlwaysUsageDescription:
        'cassier-Q needs Bluetooth access to find and connect to your receipt printer.',
      NSBluetoothPeripheralUsageDescription:
        'cassier-Q needs Bluetooth access to find and connect to your receipt printer.',
      NSLocalNetworkUsageDescription:
        'cassier-Q needs local network access to find network-connected receipt printers.',
      ITSAppUsesNonExemptEncryption: false,
      // Push FCM (data-only) bisa membangunkan app di background.
      UIBackgroundModes: ['remote-notification'],
      UISupportedInterfaceOrientations: ['UIInterfaceOrientationPortrait'],
      'UISupportedInterfaceOrientations~ipad': [
        'UIInterfaceOrientationLandscapeLeft',
        'UIInterfaceOrientationLandscapeRight',
      ],
    },
  },
  android: {
    package: BUNDLE_ID[VARIANT],
    googleServicesFile: GOOGLE_SERVICES_JSON ?? undefined,
    adaptiveIcon: {
      backgroundColor: '#0A1830',
      foregroundImage: './assets/android-icon-foreground.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: [
      'android.permission.CAMERA',
      // Dibutuhkan react-native-earl-thermal-printer untuk cari & sambung ke
      // printer struk Bluetooth (thermal/dot-matrix) — lihat src/services/printing.
      'android.permission.BLUETOOTH',
      'android.permission.BLUETOOTH_ADMIN',
      'android.permission.BLUETOOTH_CONNECT',
      'android.permission.BLUETOOTH_SCAN',
      'android.permission.ACCESS_FINE_LOCATION',
      'android.permission.ACCESS_NETWORK_STATE',
      'android.permission.CHANGE_WIFI_MULTICAST_STATE',
      // Android 13+: izin menampilkan notifikasi (diminta saat runtime oleh Notifee).
      'android.permission.POST_NOTIFICATIONS',
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-secure-store',
    'expo-screen-orientation',
    [
      // Splash native sengaja polos navy: animasi logo dikerjakan AnimatedSplash
      // di JS, yang melanjutkan warna yang sama. Gambar transparan 1x1 dibutuhkan
      // supaya plugin memasang warna latar ke storyboard iOS / tema Android 12+.
      'expo-splash-screen',
      {
        backgroundColor: '#0B1F33',
        image: './assets/splash-blank.png',
        imageWidth: 1,
        resizeMode: 'contain',
        dark: { backgroundColor: '#0B1F33', image: './assets/splash-blank.png' },
      },
    ],
    'expo-font',
    './plugins/withFirebase',
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '16.4',
          // Firebase Apple SDK lewat SPM butuh dynamic frameworks.
          ...(GOOGLE_SERVICE_INFO_PLIST ? { useFrameworks: 'dynamic' as const } : {}),
        },
        android: {
          minSdkVersion: 26,
          extraMavenRepos: [],
        },
      },
    ],
  ],
  extra: {
    apiEnv: API_ENV,
    apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
    appVariant: VARIANT,
    firebase: {
      android: GOOGLE_SERVICES_JSON != null,
      ios: GOOGLE_SERVICE_INFO_PLIST != null,
    },
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? 'REPLACE_WITH_EAS_PROJECT_ID',
    },
  },
});
