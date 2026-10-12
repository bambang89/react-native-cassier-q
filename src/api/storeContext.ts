import * as SecureStore from 'expo-secure-store';

// Toko yang sedang dibantu SUPERADMIN. Disimpan di memori supaya interceptor
// axios bisa membacanya secara sinkron, dan di SecureStore supaya pilihan
// bertahan saat app dibuka ulang.
const ACTIVE_STORE_KEY = 'cassierq.superadmin.activeStore';

export type ActiveStore = { id: string; name: string };

let activeStore: ActiveStore | null = null;

export function getActiveStoreId(): string | null {
  return activeStore?.id ?? null;
}

export async function setActiveStore(store: ActiveStore | null): Promise<void> {
  activeStore = store;
  if (store) {
    await SecureStore.setItemAsync(ACTIVE_STORE_KEY, JSON.stringify(store));
  } else {
    await SecureStore.deleteItemAsync(ACTIVE_STORE_KEY);
  }
}

export async function loadActiveStore(): Promise<ActiveStore | null> {
  try {
    const raw = await SecureStore.getItemAsync(ACTIVE_STORE_KEY);
    activeStore = raw ? (JSON.parse(raw) as ActiveStore) : null;
  } catch {
    activeStore = null;
  }
  return activeStore;
}
