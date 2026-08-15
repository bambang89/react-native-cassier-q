import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const deviceType = Platform.OS;

export const deviceOsVersion = String(Platform.Version ?? 'unknown');

export const appVersion = Constants.expoConfig?.version ?? '0.0.0';

export function generateDeviceId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const rand = (Math.random() * 16) | 0;
    const value = char === 'x' ? rand : (rand & 0x3) | 0x8;
    return value.toString(16);
  });
}
