import {
  addSslPinningErrorListener,
  initializeSslPinning,
} from 'react-native-ssl-public-key-pinning';

import { env } from '@/config/env';

const API_HOSTNAME = new URL(env.apiBaseUrl).hostname;

const PIN_CONFIG = {
  [API_HOSTNAME]: {
    includeSubdomains: false,
    publicKeyHashes: [
      'REPLACE_WITH_LEAF_CERT_SPKI_SHA256_BASE64',
      'REPLACE_WITH_BACKUP_CERT_SPKI_SHA256_BASE64',
    ],
    expirationDate: '2027-08-12',
  },
};

let initialized = false;

export async function setupSslPinning(): Promise<void> {
  if (initialized) return;

  if (env.apiEnv === 'development' || !env.apiBaseUrl.startsWith('https://')) {
    console.warn('[SSL Pinning] dilewati untuk environment ini (bukan https):', env.apiBaseUrl);
    initialized = true;
    return;
  }

  await initializeSslPinning(PIN_CONFIG);
  initialized = true;

  addSslPinningErrorListener((error) => {
    console.error('[SSL Pinning] rejected connection to', error.serverHostname, error);
  });
}
