import {
  addSslPinningErrorListener,
  initializeSslPinning,
} from 'react-native-ssl-public-key-pinning';

import { env } from '../config/env';

/**
 * Public-key pins for the API host, keyed by hostname (no scheme/path).
 *
 * These are placeholders and MUST be replaced with the real Subject Public
 * Key Info (SPKI) SHA-256 hashes of api.caissier.app before shipping a
 * release build — every network request (fetch/XHR/axios) is pinned
 * automatically once initializeSslPinning() resolves, so wrong pins will
 * hard-fail all API calls.
 *
 * To generate a pin for a live cert:
 *   openssl s_client -connect api.caissier.app:443 -servername api.caissier.app </dev/null 2>/dev/null \
 *     | openssl x509 -pubkey -noout \
 *     | openssl pkey -pubin -outform der \
 *     | openssl dgst -sha256 -binary \
 *     | openssl enc -base64
 *
 * Always include the leaf cert pin AND at least one backup pin (e.g. the
 * issuing intermediate or a pre-provisioned backup key) so a routine cert
 * rotation doesn't brick the app in the field.
 */
const API_HOSTNAME = new URL(env.apiBaseUrl).hostname;

const PIN_CONFIG = {
  [API_HOSTNAME]: {
    includeSubdomains: false,
    publicKeyHashes: [
      'REPLACE_WITH_LEAF_CERT_SPKI_SHA256_BASE64',
      'REPLACE_WITH_BACKUP_CERT_SPKI_SHA256_BASE64',
    ],
    // Forces a hard failure (instead of silently disabling pinning) once
    // this date passes without an app update shipping fresh pins.
    expirationDate: '2027-08-12',
  },
};

let initialized = false;

export async function setupSslPinning(): Promise<void> {
  if (initialized) return;
  await initializeSslPinning(PIN_CONFIG);
  initialized = true;

  addSslPinningErrorListener((error) => {
    // A pinning failure means either a MITM attempt or an un-rotated pin —
    // surface it loudly rather than silently falling back to plain TLS.
    console.error('[SSL Pinning] rejected connection to', error.serverHostname, error);
  });
}
