import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { defaultBaseUrlFor, env } from '@/config/env';
import { isApiEnvName } from '@/config/apiEnvironments';
import type { ApiEnvName } from '@/config/apiEnvironments';
import { appVersion, deviceOsVersion, deviceType } from '@/config/deviceInfo';
import { clearTokens, ensureDeviceId, loadTokens, saveTokens, type TokenSet } from './tokenStorage';
import { getActiveStoreId } from './storeContext';

type SessionExpiredHandler = () => void;
let onSessionExpired: SessionExpiredHandler | null = null;
export function setSessionExpiredHandler(handler: SessionExpiredHandler | null): void {
  onSessionExpired = handler;
}

declare module 'axios' {
  export interface InternalAxiosRequestConfig {
    _retry?: boolean;
  }
}

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
});

const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
];

const refreshClient = axios.create({ baseURL: env.apiBaseUrl, timeout: 15000 });

let refreshPromise: Promise<TokenSet> | null = null;

type AuthResponseBody = {
  accessToken: string;
  refreshToken: string;
  /** epoch millis */
  expiresAt: number;
};

async function refreshAccessToken(): Promise<TokenSet> {
  const current = await loadTokens();
  if (!current?.refreshToken) {
    throw new Error('No refresh token available');
  }

  const { data } = await refreshClient.post<AuthResponseBody>('/auth/refresh', {
    refreshToken: current.refreshToken,
  });

  const tokens: TokenSet = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: data.expiresAt,
  };
  await saveTokens(tokens);
  return tokens;
}

// Refresh sedikit sebelum benar-benar kedaluwarsa, supaya request yang sedang
// jalan tidak sampai ditolak 401 di tengah jalan.
const EXPIRY_SKEW_MS = 60_000;

function isTokenExpired(tokens: TokenSet): boolean {
  return tokens.expiresAt - EXPIRY_SKEW_MS <= Date.now();
}

/** Gabungkan permintaan refresh yang datang bersamaan jadi satu panggilan. */
function sharedRefresh(): Promise<TokenSet> {
  refreshPromise ??= refreshAccessToken().finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

let forceLogoutPromise: Promise<void> | null = null;

async function forceLogoutOnExpiry(): Promise<void> {
  forceLogoutPromise ??= (async () => {
    const current = await loadTokens();
    try {
      if (current?.refreshToken) {
        await refreshClient.post('/auth/logout', { refreshToken: current.refreshToken });
      }
    } catch {
      // Server mungkin sudah menganggap refresh token itu mati juga — tetap
      // lanjut bersihkan sesi lokal, jangan biarkan user nyangkut.
    } finally {
      await clearTokens();
      onSessionExpired?.();
    }
  })().finally(() => {
    forceLogoutPromise = null;
  });
  return forceLogoutPromise;
}

// Device headers go on every request, including login/register/refresh —
// the server only records a device from the headers sent on those auth
// calls (see AuthService.issueTokens -> recordDevice), so skipping them
// there meant the device was never registered and later requests got
// rejected as "device not recognized".
async function attachDeviceHeaders(config: InternalAxiosRequestConfig): Promise<InternalAxiosRequestConfig> {
  const deviceId = await ensureDeviceId();
  config.headers.set('X-Device-Id', deviceId);
  config.headers.set('X-Device-OS', deviceOsVersion);
  config.headers.set('X-App-Version', appVersion);
  config.headers.set('X-Device-Type', deviceType);
  return config;
}

apiClient.interceptors.request.use(attachDeviceHeaders);
refreshClient.interceptors.request.use(attachDeviceHeaders);

// SUPERADMIN bekerja atas nama toko yang dipilihnya; backend mengabaikan
// header ini untuk user lain (mereka selalu di toko sendiri).
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const storeId = getActiveStoreId();
  if (storeId) config.headers.set('X-Store-Id', storeId);
  return config;
});

// --- Bearer token attachment --------------------------------------------
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (PUBLIC_AUTH_PATHS.some((path) => config.url?.includes(path))) {
    return config;
  }
  let tokens = await loadTokens();
  if (tokens && isTokenExpired(tokens)) {
    // Access token habis: tukar dengan refresh token (berlaku 30 hari) dulu.
    // Baru logout kalau refresh token-nya sendiri sudah mati.
    try {
      tokens = await sharedRefresh();
    } catch {
      await forceLogoutOnExpiry();
      return Promise.reject(new axios.Cancel('Session expired (refresh token tidak berlaku lagi)'));
    }
  }
  if (tokens?.accessToken) {
    config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined;

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      return Promise.reject(error);
    }
    if (originalRequest.url?.includes('/auth/refresh')) {
      // Panggilan refresh itu sendiri ditolak — refresh token sudah mati.
      await clearTokens();
      onSessionExpired?.();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // Gabungkan 401 yang datang bersamaan jadi satu panggilan refresh saja.
      const tokens = await sharedRefresh();

      originalRequest.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
      return apiClient(originalRequest);
    } catch (refreshError) {
      await clearTokens();
      onSessionExpired?.();
      return Promise.reject(refreshError);
    }
  },
);

const API_ENV_OVERRIDE_KEY = 'cassierq.apiEnvOverride';

let activeApiEnv: ApiEnvName = env.apiEnv;

export function getActiveApiEnv(): ApiEnvName {
  return activeApiEnv;
}

export function getActiveApiBaseUrl(): string {
  return apiClient.defaults.baseURL ?? env.apiBaseUrl;
}

function applyBaseUrl(baseUrl: string): void {
  apiClient.defaults.baseURL = baseUrl;
  refreshClient.defaults.baseURL = baseUrl;
}

/** Pindah backend saat runtime. Dipanggil dari UI switcher di ProfileScreen. */
export async function setActiveApiEnv(nextEnv: ApiEnvName): Promise<void> {
  activeApiEnv = nextEnv;
  applyBaseUrl(defaultBaseUrlFor(nextEnv));
  await SecureStore.setItemAsync(API_ENV_OVERRIDE_KEY, nextEnv);
  await clearTokens();
  onSessionExpired?.();
}

/** Dipanggil sekali saat app start, sebelum bootstrapAuth, supaya override tersimpan langsung dipakai. */
export async function loadPersistedApiEnvOverride(): Promise<void> {
  try {
    const stored = await SecureStore.getItemAsync(API_ENV_OVERRIDE_KEY);
    if (isApiEnvName(stored) && stored !== activeApiEnv) {
      activeApiEnv = stored;
      applyBaseUrl(defaultBaseUrlFor(stored));
    }
  } catch {
    // SecureStore tidak tersedia (mis. web) — abaikan, tetap pakai default build-time.
  }
}
