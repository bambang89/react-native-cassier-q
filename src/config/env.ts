import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { API_ENVIRONMENTS, DEFAULT_API_ENV, isApiEnvName } from './apiEnvironments';
import type { ApiEnvName } from './apiEnvironments';

type Extra = {
  apiEnv: string;
  apiBaseUrl: string;
  appVariant: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<Extra>;

const buildTimeApiEnv: ApiEnvName = isApiEnvName(extra.apiEnv) ? extra.apiEnv : DEFAULT_API_ENV;

/**
 * Emulator Android tidak bisa resolve "localhost" ke mesin host — itu selalu
 * merujuk ke emulator itu sendiri. Google mendokumentasikan 10.0.2.2 sebagai
 * alias khusus ke loopback mesin host untuk kasus ini. iOS simulator & web
 * tidak butuh ini karena mereka share network stack dengan mesin host.
 * Fisik device tetap butuh IP LAN mesin dev — set lewat EXPO_PUBLIC_API_BASE_URL.
 */
function resolveDevBaseUrl(rawUrl: string): string {
  if (Platform.OS !== 'android') return rawUrl;
  try {
    const url = new URL(rawUrl);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') {
      url.hostname = '10.0.2.2';
      return url.toString().replace(/\/$/, '');
    }
  } catch {
    // rawUrl tidak valid sebagai URL, biarkan apa adanya.
  }
  return rawUrl;
}

function defaultBaseUrlFor(apiEnv: ApiEnvName): string {
  const raw = API_ENVIRONMENTS[apiEnv].apiBaseUrl;
  return apiEnv === 'development' ? resolveDevBaseUrl(raw) : raw;
}

export const env = {
  /** Environment API aktif saat build/start (lihat APP_ENV di app.config.ts). Bisa dioverride runtime, lihat api/client.ts#setActiveApiEnv. */
  apiEnv: buildTimeApiEnv,
  /**
   * EXPO_PUBLIC_API_BASE_URL selalu menang kalau di-set eksplisit (mis. untuk
   * testing di HP fisik lewat IP LAN mesin dev). Kalau tidak, dipetakan dari
   * apiEnv lewat API_ENVIRONMENTS.
   */
  apiBaseUrl: extra.apiBaseUrl && extra.apiBaseUrl.length > 0 ? extra.apiBaseUrl : defaultBaseUrlFor(buildTimeApiEnv),
  appVariant: extra.appVariant ?? 'production',
};

export { API_ENVIRONMENTS, DEFAULT_API_ENV, isApiEnvName, defaultBaseUrlFor };
export type { ApiEnvName };
