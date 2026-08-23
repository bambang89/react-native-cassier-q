import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'cassierq.auth.accessToken';
const REFRESH_TOKEN_KEY = 'cassierq.auth.refreshToken';
const EXPIRES_AT_KEY = 'cassierq.auth.expiresAt';
const DEVICE_ID_KEY = 'cassierq.session.deviceId';
const REMEMBERED_USERNAME_KEY = 'cassierq.auth.rememberedUsername';

export type TokenSet = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
};

export async function saveTokens(tokens: TokenSet): Promise<void> {
  await Promise.all([
    SecureStore.setItemAsync(ACCESS_TOKEN_KEY, tokens.accessToken),
    SecureStore.setItemAsync(REFRESH_TOKEN_KEY, tokens.refreshToken),
    SecureStore.setItemAsync(EXPIRES_AT_KEY, String(tokens.expiresAt)),
  ]);
}

export async function loadTokens(): Promise<TokenSet | null> {
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
    SecureStore.deleteItemAsync(DEVICE_ID_KEY),
  ]);
}

export async function saveDeviceId(deviceId: string): Promise<void> {
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId);
}

export async function loadDeviceId(): Promise<string | null> {
  return SecureStore.getItemAsync(DEVICE_ID_KEY);
}

export async function saveRememberedUsername(username: string): Promise<void> {
  await SecureStore.setItemAsync(REMEMBERED_USERNAME_KEY, username);
}

export async function loadRememberedUsername(): Promise<string | null> {
  return SecureStore.getItemAsync(REMEMBERED_USERNAME_KEY);
}

export async function clearRememberedUsername(): Promise<void> {
  await SecureStore.deleteItemAsync(REMEMBERED_USERNAME_KEY);
}
