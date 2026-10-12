import { useRef } from 'react';
import { Animated, Pressable as RNPressable } from 'react-native';
import type { GestureResponderEvent, PressableProps, StyleProp, ViewStyle } from 'react-native';

import { motion } from '@/theme/motion';

// Pressable-nya sendiri yang dianimasikan (bukan view di dalamnya), jadi
// style layout seperti flex: 1 / width: '100%' tetap berlaku ke elemen terluar.
const AnimatedPressable = Animated.createAnimatedComponent(RNPressable);

export interface PressableScaleProps extends Omit<PressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Skala saat ditekan; 0.97 untuk tombol/kartu, 0.92 untuk ikon kecil. */
  activeScale?: number;
}

/**
 * Pressable yang sedikit mengecil dengan spring saat ditekan — umpan balik
 * sentuh yang terasa "fisik", dipakai Button, Card, chip, dan item grid.
 */
export function PressableScale({
  style,
  activeScale = 0.97,
  disabled,
  onPressIn,
  onPressOut,
  ...rest
}: PressableScaleProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (toValue: number) =>
    Animated.spring(scale, { toValue, useNativeDriver: true, ...motion.spring.press }).start();

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={(event: GestureResponderEvent) => {
        animateTo(activeScale);
        onPressIn?.(event);
      }}
      onPressOut={(event: GestureResponderEvent) => {
        animateTo(1);
        onPressOut?.(event);
      }}
      style={[style, { opacity: disabled ? 0.5 : 1, transform: [{ scale }] }]}
      {...rest}
    />
  );
}
