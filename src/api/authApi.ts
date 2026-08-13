import { env } from '../config/env';
import { apiClient } from './client';
import { clearTokens, saveTokens, type OAuthTokenSet } from './tokenStorage';
import type { User } from '../types/models';

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
};

async function persistTokenResponse(data: TokenResponse): Promise<OAuthTokenSet> {
  const tokens: OAuthTokenSet = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: Date.now() + data.expires_in * 1000,
  };
  await saveTokens(tokens);
  return tokens;
}

/**
 * OAuth2 "Resource Owner Password Credentials" grant against the store's own
 * auth server (api.caissier.app). Swap this for an Authorization Code + PKCE
 * flow via expo-auth-session if/when login moves to a third-party identity
 * provider instead of first-party username/password.
 */
export async function login(email: string, password: string): Promise<User> {
  const { data } = await apiClient.post<TokenResponse>('/oauth/token', {
    grant_type: 'password',
    client_id: env.oauthClientId,
    username: email,
    password,
  });
  await persistTokenResponse(data);

  const { data: user } = await apiClient.get<User>('/me');
  return user;
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post('/oauth/revoke');
  } finally {
    await clearTokens();
  }
}

export async function fetchCurrentUser(): Promise<User> {
  const { data } = await apiClient.get<User>('/me');
  return data;
}
