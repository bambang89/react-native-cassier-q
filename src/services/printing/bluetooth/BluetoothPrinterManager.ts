import { PermissionsAndroid, Platform } from 'react-native';
import { BLEPrinter } from 'react-native-earl-thermal-printer';
import type { IBLEPrinter } from 'react-native-earl-thermal-printer';

let initialized = false;
let connectedAddress: string | null = null;

async function ensureAndroidPermissions(): Promise<void> {
  if (Platform.OS !== 'android') return;

  const permissions = [
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
    PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  ];
  const results = await PermissionsAndroid.requestMultiple(permissions);
  const denied = permissions.some((permission) => results[permission] !== PermissionsAndroid.RESULTS.GRANTED);
  if (denied) {
    throw new Error('Izin Bluetooth ditolak. Aktifkan izin Bluetooth untuk cassier-Q di pengaturan perangkat.');
  }
}

async function ensureInit(): Promise<void> {
  if (initialized) return;
  await ensureAndroidPermissions();
  await BLEPrinter.init();
  initialized = true;
}

/** Pindai printer Bluetooth yang sudah ter-pairing di sistem (Android: paired devices; iOS: bonded BLE peripherals). */
export async function scanBluetoothPrinters(): Promise<IBLEPrinter[]> {
  await ensureInit();
  return BLEPrinter.getDeviceList();
}

export async function connectBluetoothPrinter(address: string): Promise<IBLEPrinter> {
  await ensureInit();
  const device = await BLEPrinter.connectPrinter(address);
  connectedAddress = address;
  return device;
}

/** Sambung ulang cuma kalau device yang diminta beda dari yang sedang terhubung — hindari re-connect tiap kali cetak. */
export async function ensureConnected(address: string): Promise<void> {
  await ensureInit();
  if (connectedAddress === address) return;
  await BLEPrinter.connectPrinter(address);
  connectedAddress = address;
}

export function disconnectBluetoothPrinter(): void {
  if (!connectedAddress) return;
  BLEPrinter.closeConn();
  connectedAddress = null;
}

export function getConnectedAddress(): string | null {
  return connectedAddress;
}
