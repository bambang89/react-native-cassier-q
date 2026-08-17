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
  apiEnv: buildTimeApiEnv,
  apiBaseUrl: extra.apiBaseUrl && extra.apiBaseUrl.length > 0 ? extra.apiBaseUrl : defaultBaseUrlFor(buildTimeApiEnv),
  appVariant: extra.appVariant ?? 'production',
};

export { API_ENVIRONMENTS, DEFAULT_API_ENV, isApiEnvName, defaultBaseUrlFor };
export type { ApiEnvName };
