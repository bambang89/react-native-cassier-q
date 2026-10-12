import notifee, { AndroidImportance, AuthorizationStatus, EventType } from '@notifee/react-native';
import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  setBackgroundMessageHandler,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Notifikasi lokal (Notifee) selalu tersedia; push FCM hanya kalau Firebase
// platform ini dikonfigurasi saat build — lihat plugins/withFirebase.js.
const firebaseExtra = (Constants.expoConfig?.extra?.firebase ?? {}) as Record<string, boolean>;
export const isPushAvailable = firebaseExtra[Platform.OS] === true;

export const DEFAULT_CHANNEL_ID = 'default';

async function ensureDefaultChannel(): Promise<string> {
  // Di iOS tidak ada channel; Notifee mengabaikan panggilan ini.
  return notifee.createChannel({
    id: DEFAULT_CHANNEL_ID,
    name: 'Umum',
    importance: AndroidImportance.HIGH,
  });
}

type LocalNotification = {
  title?: string;
  body?: string;
  data?: Record<string, string>;
};

export async function showNotification({ title, body, data }: LocalNotification): Promise<void> {
  const channelId = await ensureDefaultChannel();
  await notifee.displayNotification({
    title,
    body,
    data,
    android: { channelId, pressAction: { id: 'default' } },
  });
}

function toStringData(data: RemoteMessage['data']): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(data ?? {})) {
    result[key] = typeof value === 'string' ? value : JSON.stringify(value);
  }
  return result;
}

/** Tampilkan pesan FCM lewat Notifee. Pesan data-only membaca title/body dari `data`. */
async function displayRemoteMessage(message: RemoteMessage): Promise<void> {
  const data = toStringData(message.data);
  const title = message.notification?.title ?? data.title;
  const body = message.notification?.body ?? data.body;
  if (!title && !body) return;
  await showNotification({ title, body, data });
}

/**
 * Wajib dipanggil di index.ts sebelum registerRootComponent: handler background
 * harus terdaftar walau app dibangunkan tanpa UI (headless).
 */
export function registerBackgroundHandlers(): void {
  if (isPushAvailable) {
    setBackgroundMessageHandler(getMessaging(), async (message) => {
      // Pesan dengan payload `notification` sudah ditampilkan sistem saat app di
      // background; hanya pesan data-only yang perlu ditampilkan sendiri.
      if (!message.notification) await displayRemoteMessage(message);
    });
  }

  notifee.onBackgroundEvent(async ({ type, detail }) => {
    if (type === EventType.PRESS && __DEV__) {
      console.log('[notifications] dibuka dari background', detail.notification?.data);
    }
  });
}

/**
 * Minta izin notifikasi, siapkan channel, dan mulai mendengarkan push FCM saat
 * app di foreground. Mengembalikan fungsi untuk berhenti mendengarkan.
 */
export async function initNotifications(
  onToken?: (token: string) => void,
): Promise<() => void> {
  const settings = await notifee.requestPermission();
  if (settings.authorizationStatus < AuthorizationStatus.AUTHORIZED) {
    if (__DEV__) console.log('[notifications] izin notifikasi ditolak');
  }
  await ensureDefaultChannel();

  const unsubscribers: (() => void)[] = [
    notifee.onForegroundEvent(({ type, detail }) => {
      if (type === EventType.PRESS && __DEV__) {
        console.log('[notifications] dibuka', detail.notification?.data);
      }
    }),
  ];

  if (isPushAvailable) {
    const messaging = getMessaging();
    const handleToken = (token: string) => {
      // Token ini yang dipakai untuk "Send test message" di Firebase Console.
      if (__DEV__) console.log('[notifications] FCM token:', token);
      onToken?.(token);
    };
    unsubscribers.push(
      onMessage(messaging, displayRemoteMessage),
      onTokenRefresh(messaging, handleToken),
    );
    getToken(messaging)
      .then(handleToken)
      .catch((error) => console.warn('[notifications] gagal mengambil FCM token', error));
  }

  return () => unsubscribers.forEach((unsubscribe) => unsubscribe());
}
