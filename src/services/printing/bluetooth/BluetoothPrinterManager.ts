import { PermissionsAndroid, Platform } from 'react-native';
import { BLEPrinter } from 'react-native-earl-thermal-printer';
import type { IBLEPrinter } from 'react-native-earl-thermal-printer';

let initialized = false;
let connectedAddress: string | null = null;

const PRINTER_UNREACHABLE =
  'Printer tidak bisa dihubungi. Pastikan printer menyala, Bluetooth aktif, dan printer berada di dekat perangkat.';

/** Requests the Bluetooth/location runtime permissions on Android; throws if any is denied. No-op on iOS. */
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

/** Initializes the native printer module once (after permissions are granted). */
async function ensureInit(): Promise<void> {
  if (initialized) return;
  await ensureAndroidPermissions();
  await BLEPrinter.init();
  initialized = true;
}

/** Returns Bluetooth printers already paired with the OS (Android: paired devices; iOS: bonded BLE peripherals). */
export async function scanBluetoothPrinters(): Promise<IBLEPrinter[]> {
  await ensureInit();
  return BLEPrinter.getDeviceList();
}

/** Opens a connection to the printer at `address` and remembers it as the active printer. */
export async function connectBluetoothPrinter(address: string): Promise<IBLEPrinter> {
  await ensureInit();
  const device = await BLEPrinter.connectPrinter(address);
  connectedAddress = address;
  return device;
}

/** Connects only when the requested printer differs from the active one, to avoid reconnecting on every print. */
export async function ensureConnected(address: string): Promise<void> {
  await ensureInit();
  if (connectedAddress === address) return;
  await BLEPrinter.connectPrinter(address);
  connectedAddress = address;
}

/** Closes the old socket and opens a fresh connection, even if the native side still reports it as connected. */
async function reconnect(address: string): Promise<void> {
  try {
    BLEPrinter.closeConn();
  } catch {
    // The socket is already dead — ignore.
  }
  connectedAddress = null;
  await BLEPrinter.connectPrinter(address);
  connectedAddress = address;
}

/**
 * Sends base64 ESC/POS data to the printer.
 * On Android, `BluetoothSocket.isConnected()` stays true after the printer drops the link (e.g. it went to sleep),
 * so the first write fails with "Broken pipe". When a write fails, reconnect once and retry;
 * if it still fails, throw a user-friendly error.
 */
export async function printRawWithReconnect(address: string, base64Data: string): Promise<void> {
  await ensureConnected(address);
  try {
    await BLEPrinter.printRawData(base64Data);
  } catch {
    try {
      await reconnect(address);
    } catch {
      throw new Error(PRINTER_UNREACHABLE);
    }
    try {
      await BLEPrinter.printRawData(base64Data);
    } catch {
      connectedAddress = null;
      throw new Error(PRINTER_UNREACHABLE);
    }
  }
}

/** Closes the active printer connection, if any. */
export function disconnectBluetoothPrinter(): void {
  if (!connectedAddress) return;
  BLEPrinter.closeConn();
  connectedAddress = null;
}

/** Returns the address of the currently connected printer, or null. */
export function getConnectedAddress(): string | null {
  return connectedAddress;
}
