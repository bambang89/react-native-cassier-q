import type { ConfigContext, ExpoConfig } from 'expo/config';

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
  orientation: 'landscape',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    requireFullScreen: true,
    bundleIdentifier: BUNDLE_ID[VARIANT],
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
      'UISupportedInterfaceOrientations~ipad': [
        'UIInterfaceOrientationLandscapeLeft',
        'UIInterfaceOrientationLandscapeRight',
      ],
    },
  },
  android: {
    package: BUNDLE_ID[VARIANT],
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
    ],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-secure-store',
    'expo-font',
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '16.4',
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
    eas: {
      projectId: process.env.EAS_PROJECT_ID ?? 'REPLACE_WITH_EAS_PROJECT_ID',
    },
  },
});
