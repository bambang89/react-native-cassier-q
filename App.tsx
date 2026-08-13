import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Provider } from 'react-redux';

import { setupSslPinning } from './src/api/sslPinning';
import RootNavigator from './src/navigation/RootNavigator';
import { store } from './src/store';

export default function App() {
  const [pinningReady, setPinningReady] = useState(false);

  useEffect(() => {
    // Must resolve before any apiClient request fires, otherwise the first
    // few requests would go out over an unpinned connection.
    setupSslPinning()
      .catch((error) => console.error('[SSL Pinning] init failed', error))
      .finally(() => setPinningReady(true));
  }, []);

  if (!pinningReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Provider store={store}>
          <RootNavigator />
          <StatusBar style="auto" />
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
