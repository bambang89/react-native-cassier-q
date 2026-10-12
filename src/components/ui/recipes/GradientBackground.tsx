import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useId } from 'react';

export interface GradientBackgroundProps {
  /** Warna dari kiri-atas ke kanan-bawah. */
  colors: readonly string[];
}

/**
 * Latar gradasi yang selalu menutup penuh induknya. Pakai viewBox 0..100 +
 * preserveAspectRatio="none" — bukan width/height "100%" — supaya ikut
 * meregang saat tinggi kartu berubah setelah font/konten selesai dimuat.
 * Taruh sebagai anak pertama dari View ber-`overflow: 'hidden'`.
 */
export function GradientBackground({ colors }: GradientBackgroundProps) {
  const id = `grad-${useId().replace(/:/g, '')}`;
  return (
    <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="none" pointerEvents="none">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          {colors.map((color, index) => (
            <Stop key={color + index} offset={`${(index / Math.max(colors.length - 1, 1)) * 100}%`} stopColor={color} />
          ))}
        </LinearGradient>
      </Defs>
      <Rect x={0} y={0} width={100} height={100} fill={`url(#${id})`} />
    </Svg>
  );
}
