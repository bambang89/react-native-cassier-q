// Lokasi file konfigurasi Firebase native, dipakai app.config.ts.
//
// Di EAS, file bisa diberikan lewat env var bertipe "file" (GOOGLE_SERVICES_JSON /
// GOOGLE_SERVICE_INFO_PLIST); lokal cukup taruh file di root project.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

function resolveFile(envValue, fallback) {
  const file = path.resolve(ROOT, envValue || fallback);
  return fs.existsSync(file) ? file : null;
}

/**
 * Path google-services.json, atau null kalau file tidak ada / tidak punya client
 * untuk package ini (plugin Gradle google-services gagal build kalau tidak cocok).
 */
function androidGoogleServicesFile(packageName) {
  const file = resolveFile(process.env.GOOGLE_SERVICES_JSON, 'google-services.json');
  if (!file) return null;
  try {
    const { client = [] } = JSON.parse(fs.readFileSync(file, 'utf8'));
    const hasClient = client.some(
      (c) => c.client_info?.android_client_info?.package_name === packageName,
    );
    return hasClient ? file : null;
  } catch {
    return null;
  }
}

/** Path GoogleService-Info.plist, atau null kalau belum ada. */
function iosGoogleServicesFile() {
  return resolveFile(process.env.GOOGLE_SERVICE_INFO_PLIST, 'GoogleService-Info.plist');
}

module.exports = { androidGoogleServicesFile, iosGoogleServicesFile };
