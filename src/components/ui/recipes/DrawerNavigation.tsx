import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { colors, shadows, spacing } from '../../../theme';

export interface DrawerNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  /** Konten panel drawer (biasanya daftar menu/navigasi). */
  drawer: ReactNode;
  /** Konten utama layar, tetap di-render di belakang drawer. */
  children: ReactNode;
  drawerWidth?: number;
}

// Recipe drawer navigation ringan tanpa dependency `@react-navigation/drawer`
// (belum terpasang di project). Kalau butuh drawer terintegrasi dengan route
// stack React Navigation, install `@react-navigation/drawer` dan pakai
// `createDrawerNavigator` alih-alih komponen ini. Ini cocok untuk drawer
// tunggal, mis. menu akun/pengaturan dari POSScreen.
export function DrawerNavigation({ isOpen, onClose, drawer, children, drawerWidth = 280 }: DrawerNavigationProps) {
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const resolvedWidth = Math.min(drawerWidth, windowWidth * 0.85);
  const translateX = useRef(new Animated.Value(-resolvedWidth)).current;

  useEffect(() => {
    Animated.timing(translateX, {
      toValue: isOpen ? 0 : -resolvedWidth,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [isOpen, resolvedWidth, translateX]);

  return (
    <View style={styles.container}>
      {children}

      {isOpen ? (
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <View style={[StyleSheet.absoluteFill, styles.backdrop]} />
        </Pressable>
      ) : null}

      <Animated.View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[
          styles.panel,
          shadows.lg,
          { width: resolvedWidth, paddingTop: insets.top, transform: [{ translateX }] },
        ]}
      >
        {drawer}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backdrop: { backgroundColor: colors.overlay },
  panel: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.base,
  },
});
