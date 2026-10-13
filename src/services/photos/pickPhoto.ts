import * as ImagePicker from 'expo-image-picker';
import { Alert, Linking } from 'react-native';

import type { ProductPhotoFile } from '@/api/productsApi';

export type PhotoSource = 'camera' | 'library';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

function permissionDenied(what: string, canAskAgain: boolean) {
  // Sudah ditolak permanen: dialog izin sistem tidak akan muncul lagi, jadi
  // arahkan ke Pengaturan alih-alih diam saja.
  Alert.alert(
    'Izin dibutuhkan',
    `cassier-Q butuh akses ${what} untuk menambahkan foto produk.`,
    canAskAgain
      ? [{ text: 'OK' }]
      : [
          { text: 'Batal', style: 'cancel' },
          { text: 'Buka Pengaturan', onPress: () => Linking.openSettings() },
        ],
  );
}

/** Ambil satu foto dari kamera atau galeri; null kalau batal atau izin ditolak. */
export async function pickPhoto(source: PhotoSource): Promise<ProductPhotoFile | null> {
  try {
    if (source === 'camera') {
      const permission = await ImagePicker.requestCameraPermissionsAsync();
      if (!permission.granted) {
        permissionDenied('kamera', permission.canAskAgain);
        return null;
      }
    }
    // Galeri: Android 13+ memakai Photo Picker sistem dan iOS 14+ PHPicker,
    // keduanya tanpa izin baca media, jadi tidak perlu minta izin di sini.

    const result =
      source === 'camera'
        ? await ImagePicker.launchCameraAsync(PICKER_OPTIONS)
        : await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS);
    if (result.canceled) return null;

    const asset = result.assets[0];
    const type = asset.mimeType ?? 'image/jpeg';
    const extension = type.split('/')[1] ?? 'jpg';
    return { uri: asset.uri, name: asset.fileName ?? `product-photo.${extension}`, type };
  } catch {
    Alert.alert('Gagal', source === 'camera' ? 'Kamera tidak bisa dibuka.' : 'Galeri tidak bisa dibuka.');
    return null;
  }
}

/**
 * Tanya sumber foto (Kamera / Galeri) lalu ambil fotonya. Dengan `onRemove`,
 * muncul juga pilihan "Hapus Foto" (untuk foto yang sudah ada).
 */
export function choosePhoto(
  onPicked: (file: ProductPhotoFile) => void,
  options: { title?: string; onRemove?: () => void } = {},
) {
  const pick = async (source: PhotoSource) => {
    const file = await pickPhoto(source);
    if (file) onPicked(file);
  };
  Alert.alert(options.title ?? 'Foto produk', 'Ambil foto dari mana?', [
    { text: 'Kamera', onPress: () => pick('camera') },
    { text: 'Galeri', onPress: () => pick('library') },
    ...(options.onRemove ? [{ text: 'Hapus Foto', style: 'destructive' as const, onPress: options.onRemove }] : []),
    { text: 'Batal', style: 'cancel' },
  ]);
}
