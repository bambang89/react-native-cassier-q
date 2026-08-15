import type { ConfigContext, ExpoConfig } from 'expo/config';

import { isApiEnvName } from './src/config/apiEnvironments';
const VARIANT = process.env.APP_VARIANT ?? 'production';

const API_ENV = isApiEnvName(process.env.APP_ENV)
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
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'automatic',
  ios: {
    supportsTablet: true,
    bundleIdentifier: BUNDLE_ID[VARIANT],
    infoPlist: {
      NSCameraUsageDescription:
        'cassier-Q needs camera access to scan product barcodes at checkout.',
      NSMicrophoneUsageDescription:
        'cassier-Q does not record audio; this permission is required by the camera module.',
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: BUNDLE_ID[VARIANT],
    adaptiveIcon: {
      backgroundColor: '#E6F4FE',
      foregroundImage: './assets/android-icon-foreground.png',
      backgroundImage: './assets/android-icon-background.png',
      monochromeImage: './assets/android-icon-monochrome.png',
    },
    predictiveBackGestureEnabled: false,
    permissions: ['android.permission.CAMERA'],
  },
  web: {
    favicon: './assets/favicon.png',
  },
  plugins: [
    'expo-secure-store',
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
    'expo-status-bar',
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
