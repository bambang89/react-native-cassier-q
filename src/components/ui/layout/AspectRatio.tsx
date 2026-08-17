import { View } from 'react-native';
import type { ViewProps } from 'react-native';

export interface AspectRatioProps extends ViewProps {
  /** lebar/tinggi — 16/9, 1 (bujur sangkar), 4/3, dst. Default 1. */
  ratio?: number;
}

// Wadah yang mempertahankan rasio lebar:tinggi (mis. thumbnail produk 1:1,
// banner 16:9) — pakai `aspectRatio` bawaan Yoga/RN, bukan trik onLayout
// manual. Isi (mis. <Image resizeMode="cover">) tinggal diberi style flex:1.
export function AspectRatio({ ratio = 1, style, children, ...rest }: AspectRatioProps) {
  return (
    <View style={[{ width: '100%', aspectRatio: ratio }, style]} {...rest}>
      {children}
    </View>
  );
}
