import { useCallback, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { useCameraPermission } from 'react-native-vision-camera';
import { CodeScanner, type Barcode } from 'react-native-vision-camera-barcode-scanner';
import { useIsFocused } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import { useAppDispatch } from '@/store/hooks';
import { fetchProductByBarcode } from '@/store/slices/productsSlice';
import type { RootStackParamList } from '@/navigation/types';
import { colors, radii } from '@/theme';

type Props = NativeStackScreenProps<RootStackParamList, 'Scanner'>;

export default function ScannerScreen({ navigation, route }: Props) {
  const { onFound, onNotFound } = route.params;
  const { hasPermission, requestPermission } = useCameraPermission();
  const dispatch = useAppDispatch();
  const isFocused = useIsFocused();
  const [lookingUp, setLookingUp] = useState(false);
  const lastScannedRef = useRef<string | null>(null);

  const onScanned = useCallback(
    async (barcodes: Barcode[]) => {
      const value = barcodes[0]?.displayValue;
      if (!value || value === lastScannedRef.current || lookingUp) return;
      lastScannedRef.current = value;
      setLookingUp(true);
      try {
        const product = await dispatch(fetchProductByBarcode(value)).unwrap();
        if (product) {
          onFound(product);
          navigation.goBack();
        } else if (onNotFound) {
          onNotFound(value);
          navigation.goBack();
        } else {
          Alert.alert('Tidak ditemukan', `Produk dengan barcode ${value} tidak ada.`, [
            { text: 'OK', onPress: () => { lastScannedRef.current = null; } },
          ]);
        }
      } catch {
        Alert.alert('Error', 'Gagal mencari produk.', [
          { text: 'OK', onPress: () => { lastScannedRef.current = null; } },
        ]);
      } finally {
        setLookingUp(false);
      }
    },
    [dispatch, lookingUp, navigation, onFound, onNotFound],
  );

  if (!hasPermission) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Aplikasi butuh akses kamera untuk scan barcode.</Text>
        <Pressable style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Izinkan Kamera</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CodeScanner
        style={StyleSheet.absoluteFill}
        isActive={isFocused && !lookingUp}
        barcodeFormats={['ean-13', 'ean-8', 'upc-a', 'upc-e', 'code-128', 'qr-code']}
        onBarcodeScanned={onScanned}
        onError={(error) => console.error('[Scanner] error', error)}
      />
      {lookingUp ? (
        <View style={styles.overlay}>
          <ActivityIndicator color={colors.white} size="large" />
        </View>
      ) : null}
      <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
        <Text style={styles.closeButtonText}>Tutup</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.black },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  message: { textAlign: 'center', marginBottom: 16 },
  button: { backgroundColor: colors.primary[600], borderRadius: radii.md, paddingVertical: 12, paddingHorizontal: 20 },
  buttonText: { color: colors.white, fontWeight: '600' },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: colors.overlayStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 56,
    right: 20,
    backgroundColor: colors.overlayStrong,
    borderRadius: radii.full,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  closeButtonText: { color: colors.white, fontWeight: '600' },
});
