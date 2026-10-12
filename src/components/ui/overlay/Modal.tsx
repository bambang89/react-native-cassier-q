import { useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Modal as RNModal, Platform, Pressable, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, motion, radii, shadows, spacing } from '@/theme';
import { useResponsive } from '@/hooks/useResponsive';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  closeOnBackdropPress?: boolean;
}

/**
 * HP: bottom sheet yang naik dari bawah (mudah dijangkau jempol).
 * Tablet: kartu di tengah yang muncul dengan fade + scale.
 * Animasi keluar juga dimainkan dulu sebelum RN Modal benar-benar ditutup.
 */
export function Modal({ isOpen, onClose, children, closeOnBackdropPress = true }: ModalProps) {
  const { isTablet, height } = useResponsive();
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(0)).current;
  const [mounted, setMounted] = useState(isOpen);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      Animated.spring(progress, { toValue: 1, useNativeDriver: true, ...motion.spring.gentle }).start();
    } else if (mounted) {
      Animated.timing(progress, {
        toValue: 0,
        duration: motion.duration.fast,
        easing: motion.easing.inOut,
        useNativeDriver: true,
      }).start(({ finished }) => finished && setMounted(false));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const backdropStyle = { opacity: progress };
  const sheetStyle = isTablet
    ? {
        opacity: progress,
        transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }],
      }
    : {
        transform: [{ translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [height * 0.6, 0] }) }],
      };

  return (
    <RNModal
      visible={mounted}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
          <Pressable style={styles.flex} onPress={closeOnBackdropPress ? onClose : undefined} />
        </Animated.View>
        <View style={[styles.flex, isTablet ? styles.centerLayout : styles.sheetLayout]} pointerEvents="box-none">
          <Animated.View
            style={[
              isTablet ? styles.card : styles.sheet,
              !isTablet && { paddingBottom: spacing.lg + insets.bottom, maxHeight: height * 0.92 },
              sheetStyle,
            ]}
          >
            {!isTablet ? <View style={styles.grabber} /> : null}
            {children}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  backdrop: { backgroundColor: colors.overlay },
  centerLayout: { alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  sheetLayout: { justifyContent: 'flex-end' },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: colors.background,
    borderRadius: radii['2xl'],
    padding: spacing.xl,
    ...shadows.lg,
  },
  sheet: {
    width: '100%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    ...shadows.float,
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.gray[300],
    marginBottom: spacing.md,
  },
});
