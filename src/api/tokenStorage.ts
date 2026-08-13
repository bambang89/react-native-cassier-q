import * as SecureStore from 'expo-secure-store';

// expo-secure-store backs onto Keychain (iOS) / Keystore-encrypted SharedPreferences
// (Android), so OAuth tokens never touch plain-text storage on device.
const ACCESS_TOKEN_KEY = 'cassierq.oauth.accessToken';
const REFRESH_TOKEN_KEY = 'cassierq.oauth.refreshToken';
const EXPIRES_AT_KEY = 'cassierq.oauth.expiresAt';

export type OAuthTokenSet = {
  accessToken: string;
  refreshToken: string;
  /** epoch milliseconds */
  expiresAt: number;
};

export async function saveTokens(tokens: OAuthTokenSet): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
    SecureStore.setItemAsync(EXPIRES_AT_KEY, String(tokens.expiresAt)),
  ]);
}

export async function loadTokens(): Promise<OAuthTokenSet | null> {
  const [accessToken, refreshToken, expiresAt] = await Promise.all([
    SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.getItemAsync(EXPIRES_AT_KEY),
  ]);

  if (!accessToken || !refreshToken || !expiresAt) {
    return null;
  }

  return { accessToken, refreshToken, expiresAt: Number(expiresAt) };
}

export async function clearTokens(): Promise<void> {
  await Promise.all([
    SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
    SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    SecureStore.deleteItemAsync(EXPIRES_AT_KEY),
  ]);
}
