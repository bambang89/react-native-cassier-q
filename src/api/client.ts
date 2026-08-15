import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';

import { defaultBaseUrlFor, env } from '@/config/env';
import { isApiEnvName } from '@/config/apiEnvironments';
import type { ApiEnvName } from '@/config/apiEnvironments';
import { clearTokens, loadTokens, saveTokens, type TokenSet } from './tokenStorage';

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

// Endpoint auth yang tidak butuh (atau belum punya) access token — jangan
// pernah nempelin bearer token yang mungkin sudah kedaluwarsa ke sini.
// `/auth/me` dan `/auth/change-password` SENGAJA tidak masuk daftar ini
// karena keduanya butuh bearer token (lihat security di /v3/api-docs).
const PUBLIC_AUTH_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/refresh',
  '/auth/logout',
  '/auth/forgot-password',
  '/auth/reset-password',
];

// --- Bearer token attachment --------------------------------------------
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (PUBLIC_AUTH_PATHS.some((path) => config.url?.includes(path))) {
    return config;
  }
  const tokens = await loadTokens();
  if (tokens?.accessToken) {
    config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  }
  return config;
});

// --- Refresh token on 401, with request queueing ------------------------
// Axios instance terpisah dari apiClient supaya panggilan refresh tidak
// pernah re-enter response interceptor di bawah (hindari infinite loop).
const refreshClient = axios.create({ baseURL: env.apiBaseUrl, timeout: 15000 });

let refreshPromise: Promise<TokenSet> | null = null;

type AuthResponseBody = {
  accessToken: string;
  refreshToken: string;
  expiresInSeconds: number;
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
    expiresAt: Date.now() + data.expiresInSeconds * 1000,
  };
  await saveTokens(tokens);
  return tokens;
}

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
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });
      const tokens = await refreshPromise;

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
  // Ganti backend = identitas sesi lama (token) sudah tidak relevan.
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
