import { registerRootComponent } from 'expo';

import App from './App';
import { registerBackgroundHandlers } from './src/services/notifications';

// Harus sebelum registerRootComponent: push FCM bisa membangunkan app tanpa UI.
registerBackgroundHandlers();

registerRootComponent(App);
