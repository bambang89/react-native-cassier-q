// Pengganti plugin '@react-native-firebase/app' + '/messaging' yang menerapkan
// konfigurasi native per platform hanya kalau file Firebase-nya tersedia.
// Plugin aslinya melempar error saat prebuild kalau salah satu file tidak ada,
// padahal sejauh ini baru Android produksi (com.cassierq.pos) yang terdaftar.
const path = require('path');
const { withPlugins } = require('@expo/config-plugins');

// Sub-plugin per platform tidak diekspos lewat "exports", jadi di-require dari path.
const requirePluginBuild = (pkg, subpath) =>
  require(path.join(path.dirname(require.resolve(`${pkg}/package.json`)), 'plugin/build', subpath));
const android = requirePluginBuild('@react-native-firebase/app', 'android');
const ios = requirePluginBuild('@react-native-firebase/app', 'ios');
const messagingAndroid = requirePluginBuild('@react-native-firebase/messaging', 'android');

const withFirebase = (config) => {
  const plugins = [];

  if (config.android?.googleServicesFile) {
    plugins.push(
      android.withBuildscriptDependency,
      android.withApplyGoogleServicesPlugin,
      android.withCopyAndroidGoogleServices,
      messagingAndroid.withExpoPluginFirebaseNotification,
    );
  } else {
    console.warn(
      `[firebase] google-services.json untuk ${config.android?.package} tidak ditemukan — Firebase Android dinonaktifkan.`,
    );
  }

  if (config.ios?.googleServicesFile) {
    plugins.push(ios.withFirebaseAppDelegate, ios.withIosGoogleServicesFile);
  } else {
    // Pod Firebase juga tidak di-link di iOS (expo.autolinking.ios.exclude di
    // package.json) — hapus exclude itu begitu GoogleService-Info.plist ditambahkan.
    console.warn('[firebase] GoogleService-Info.plist tidak ditemukan — Firebase iOS dinonaktifkan.');
  }

  return withPlugins(config, plugins);
};

module.exports = withFirebase;
