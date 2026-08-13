import Constants from 'expo-constants';

type Extra = {
  apiBaseUrl: string;
  oauthClientId: string;
  appVariant: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Partial<Extra>;

export const env = {
  apiBaseUrl: extra.apiBaseUrl ?? 'https://api.caissier.app/v1',
  oauthClientId: extra.oauthClientId ?? 'cassier-q-mobile',
  appVariant: extra.appVariant ?? 'production',
};
