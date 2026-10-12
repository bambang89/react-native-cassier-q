import { useEffect, useRef } from 'react';
import { Animated } from 'react-native';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { motion } from '@/theme/motion';

export interface FadeInViewProps {
  children?: ReactNode;
  /** ms sebelum animasi mulai — pakai staggerDelay(index) untuk daftar. */
  delay?: number;
  /** Jarak geser awal (px). Positif = naik dari bawah. */
  offsetY?: number;
  offsetX?: number;
  /** Skala awal, mis. 0.96 untuk efek "muncul" pada kartu. */
  fromScale?: number;
  duration?: number;
  style?: StyleProp<ViewStyle>;
}

/**
 * Konten masuk dengan fade + geser halus saat pertama di-mount. Semua di
 * native driver (opacity/transform), jadi tetap 60fps walau JS sedang sibuk.
 */
export function FadeInView({
  children,
  delay = 0,
  offsetY = 12,
  offsetX = 0,
  fromScale = 1,
  duration = motion.duration.slow,
  style,
}: FadeInViewProps) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration,
      delay,
      easing: motion.easing.out,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [delay, duration, progress]);

  const transform = [
    { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [offsetY, 0] }) },
    { translateX: progress.interpolate({ inputRange: [0, 1], outputRange: [offsetX, 0] }) },
    { scale: progress.interpolate({ inputRange: [0, 1], outputRange: [fromScale, 1] }) },
  ];

  return <Animated.View style={[style, { opacity: progress, transform }]}>{children}</Animated.View>;
}
