import { apiClient } from './client';
import { clearTokens, loadTokens, saveDeviceId, saveTokens, type TokenSet } from './tokenStorage';
import { generateDeviceId } from '@/config/deviceInfo';
import type { AuthResponse, User } from '@/types/models';

async function persistAuthResponse(data: AuthResponse): Promise<TokenSet> {
  const tokens: TokenSet = {
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    expiresAt: Date.now() + data.expiresInSeconds * 1000,
  };
  await saveTokens(tokens);
  await saveDeviceId(generateDeviceId());
  return tokens;
}

export async function login(username: string, password: string): Promise<User> {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', { username, password });
  await persistAuthResponse(data);
  return data.user;
}

export interface RegisterPayload {
  storeCode: string;
  storeName: string;
  username: string;
  name: string;
  email: string;
  password: string;
}

export async function register(payload: RegisterPayload): Promise<User> {
  const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
  await persistAuthResponse(data);
  return data.user;
}

export async function logout(): Promise<void> {
  try {
    const tokens = await loadTokens();
    if (tokens?.refreshToken) {
      await apiClient.post('/auth/logout', { refreshToken: tokens.refreshToken });
    }
  } finally {
    await clearTokens();
  }
}

export async function logoutAll(): Promise<void> {
  try {
    await apiClient.post('/auth/logout-all');
  } finally {
    await clearTokens();
  }
}

export async function revokeUserSessions(userId: string): Promise<void> {
  await apiClient.post(`/auth/revoke/${userId}`);
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
}

export async function forgotPassword(username: string): Promise<void> {
  await apiClient.post('/auth/forgot-password', { username });
}

export async function resetPassword(token: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/reset-password', { token, newPassword });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.post('/auth/change-password', { currentPassword, newPassword });
}
