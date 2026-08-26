import { useEffect } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, View } from 'react-native';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { addProductPhoto, deleteProductPhoto, fetchProductPhotos } from '@/store/slices/productPhotosSlice';
import type { ProductPhotoFile } from '@/api/productsApi';
import type { RootStackParamList } from '@/navigation/types';
import { colors, radii, spacing } from '@/theme';
import { FormControl, Pressable } from '@/components/ui/forms';
import { Text } from '@/components/ui/typography';
import { PlusIcon, TrashIcon } from '@/components/icons/LineIcons';

type PhotoCameraNavigation = {
  navigate: (screen: 'ProductPhotoCamera', params: RootStackParamList['ProductPhotoCamera']) => void;
};

// Sama dengan MAX_PRODUCT_PHOTOS di ProductService (backend) — batasi di sini
// juga biar tombol tambah hilang duluan, bukan cuma nunggu error dari server.
const MAX_PHOTOS = 5;

/** Galeri foto tambahan produk (di luar foto utama) — cuma tersedia saat edit, karena butuh id produk. */
export function ProductPhotoGallery({
  productId,
  navigation,
}: {
  productId: string;
  navigation: PhotoCameraNavigation;
}) {
  const dispatch = useAppDispatch();
  const photos = useAppSelector((state) => state.productPhotos.byProductId[productId]) ?? [];
  const status = useAppSelector((state) => state.productPhotos.statusByProductId[productId]);
  const atLimit = photos.length >= MAX_PHOTOS;

  useEffect(() => {
    dispatch(fetchProductPhotos(productId));
  }, [dispatch, productId]);

  const onAddPhoto = () => {
    if (atLimit) return;
    navigation.navigate('ProductPhotoCamera', {
      onCaptured: async (file: ProductPhotoFile) => {
        try {
          await dispatch(addProductPhoto({ productId, file })).unwrap();
        } catch {
          Alert.alert('Gagal', 'Foto tidak bisa diupload, coba lagi.');
        }
      },
    });
  };

  const onDeletePhoto = (photoId: string) => {
    Alert.alert('Hapus foto?', 'Foto ini akan dihapus dari galeri produk.', [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => dispatch(deleteProductPhoto({ productId, photoId })) },
    ]);
  };

  return (
    <FormControl label="Galeri foto" helperText={`Foto tambahan selain foto utama di atas (${photos.length}/${MAX_PHOTOS})`}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {photos.map((photo) => (
          <View key={photo.id} style={styles.thumbWrap}>
            <Image source={{ uri: photo.imageUrl }} style={styles.thumb} />
            <Pressable
              style={styles.removeBadge}
              onPress={() => onDeletePhoto(photo.id)}
              hitSlop={8}
              accessibilityLabel="Hapus foto"
            >
              <TrashIcon size={12} color={colors.white} />
            </Pressable>
          </View>
        ))}
        {atLimit ? null : (
          <Pressable style={styles.addTile} onPress={onAddPhoto} accessibilityLabel="Tambah foto">
            {status === 'loading' ? (
              <ActivityIndicator color={colors.text.secondary} />
            ) : (
              <PlusIcon size={20} color={colors.text.secondary} />
            )}
          </Pressable>
        )}
      </ScrollView>
    </FormControl>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingVertical: spacing.xs },
  thumbWrap: { width: 72, height: 72 },
  thumb: { width: 72, height: 72, borderRadius: radii.md, backgroundColor: colors.gray[100] },
  removeBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: radii.full,
    backgroundColor: colors.error[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTile: {
    width: 72,
    height: 72,
    borderRadius: radii.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
