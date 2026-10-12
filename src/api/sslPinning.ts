import {
  addSslPinningErrorListener,
  initializeSslPinning,
} from 'react-native-ssl-public-key-pinning';

import { env } from '@/config/env';

const API_HOSTNAME = new URL(env.apiBaseUrl).hostname;

const PIN_CONFIG = {
  [API_HOSTNAME]: {
    includeSubdomains: false,
    // Production (api.43-134-16-30.sslip.io). The server renews its Let's
    // Encrypt cert with reuse_key, so the leaf pin survives renewals. The
    // backup pin is a spare key kept at /root/pin-backup/backup-key.pem on the
    // server — switch the cert to it if the current key must ever be rotated.
    publicKeyHashes: [
      'c3pnTWvtwkBAS7P/JFFuo7zOPZSycs9Jk21x1dbpqbw=',
      'Az+S7sGEg76vqYpxXv98S0wpRcsCv6LfVlxcP53uLmo=',
    ],
    expirationDate: '2027-08-12',
  },
};

let initialized = false;

export async function setupSslPinning(): Promise<void> {
  if (initialized) return;

  if (env.apiEnv === 'development' || !env.apiBaseUrl.startsWith('https://')) {
    console.info('[SSL Pinning] dilewati untuk environment ini (bukan https):', env.apiBaseUrl);
    initialized = true;
    return;
  }

  await initializeSslPinning(PIN_CONFIG);
  initialized = true;

  addSslPinningErrorListener((error) => {
    console.error('[SSL Pinning] rejected connection to', error.serverHostname, error);
  });
}
