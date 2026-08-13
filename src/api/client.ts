import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

import { env } from '../config/env';
import { clearTokens, loadTokens, saveTokens, type OAuthTokenSet } from './tokenStorage';

/**
 * Fired after a refresh-token attempt fails outright (refresh token itself
 * expired/revoked). The Redux auth slice subscribes to this to force a
 * logout + redirect to the login screen without api/store importing each other.
 */
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

// --- OAuth2 bearer token attachment -----------------------------------
apiClient.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  if (config.url?.includes('/oauth/token')) {
    // Never attach a stale bearer token to the token endpoint itself.
    return config;
  }
  const tokens = await loadTokens();
  if (tokens?.accessToken) {
    config.headers.set('Authorization', `Bearer ${tokens.accessToken}`);
  }
  return config;
});

// --- OAuth2 refresh_token grant on 401, with request queueing ----------
// Axios instance is intentionally separate from apiClient so refresh calls
// never re-enter the response interceptor below.
const refreshClient = axios.create({ baseURL: env.apiBaseUrl, timeout: 15000 });

let refreshPromise: Promise<OAuthTokenSet> | null = null;

async function refreshAccessToken(): Promise<OAuthTokenSet> {
  const current = await loadTokens();
  if (!current?.refreshToken) {
    throw new Error('No refresh token available');
  }

  const { data } = await refreshClient.post('/oauth/token', {
    grant_type: 'refresh_token',
    refresh_token: current.refreshToken,
    client_id: env.oauthClientId,
  });

  const tokens: OAuthTokenSet = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token ?? current.refreshToken,
    expiresAt: Date.now() + data.expires_in * 1000,
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
    if (originalRequest.url?.includes('/oauth/token')) {
      // The refresh call itself was rejected — refresh token is dead.
      await clearTokens();
      onSessionExpired?.();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // Coalesce concurrent 401s into a single refresh call.
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
