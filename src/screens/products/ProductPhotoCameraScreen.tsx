import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera, useCameraDevice, useCameraPermission, usePhotoOutput } from 'react-native-vision-camera';
import type { CameraRef } from 'react-native-vision-camera';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/navigation/types';
import { colors, radii } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'ProductPhotoCamera'>;

export default function ProductPhotoCameraScreen({ navigation, route }: Props) {
  const { onCaptured } = route.params;
  const { hasPermission, requestPermission } = useCameraPermission();
  const device = useCameraDevice('back');
  const photoOutput = usePhotoOutput({ quality: 0.8 });
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const cameraRef = useRef<CameraRef>(null);
  const [capturing, setCapturing] = useState(false);

  const onCapture = async () => {
    if (capturing) return;
    setCapturing(true);
    try {
      const file = await photoOutput.capturePhotoToFile({}, {});
      const uri = file.filePath.startsWith('file://') ? file.filePath : `file://${file.filePath}`;
      onCaptured({ uri, name: 'product-photo.jpg', type: 'image/jpeg' });
      navigation.goBack();
    } catch {
      Alert.alert('Gagal', 'Tidak bisa mengambil foto, coba lagi.');
      setCapturing(false);
    }
  };

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Aplikasi butuh akses kamera untuk memotret produk.</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Izinkan Kamera</Text>
        </Pressable>
      </View>
    );
  }

  if (!device) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Kamera tidak tersedia di perangkat ini.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={isFocused}
        outputs={[photoOutput]}
      />

      <Pressable style={[styles.closeButton, { top: insets.top + 12 }]} onPress={() => navigation.goBack()}>
        <Text style={styles.closeButtonText}>Tutup</Text>
      </Pressable>

      <View style={[styles.captureRow, { bottom: insets.bottom + 24 }]}>
        <Pressable style={styles.captureButton} onPress={onCapture} disabled={capturing}>
          {capturing ? <ActivityIndicator color={colors.white} /> : <View style={styles.captureButtonInner} />}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message: { textAlign: 'center', marginBottom: 16 },
  button: { backgroundColor: colors.primary[600], borderRadius: radii.md, paddingVertical: 12, paddingHorizontal: 20 },
  buttonText: { color: colors.white, fontWeight: '600' },
  closeButton: {
    position: 'absolute',
    right: 20,
    backgroundColor: colors.overlayStrong,
    borderRadius: radii.full,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closeButtonText: { color: colors.white, fontWeight: '600' },
  captureRow: { position: 'absolute', alignSelf: 'center', alignItems: 'center' },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: radii.full,
    borderWidth: 4,
    borderColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonInner: { width: 56, height: 56, borderRadius: radii.full, backgroundColor: colors.white },
});
