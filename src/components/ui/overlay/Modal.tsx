import { Modal as RNModal, Pressable, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { colors, radii, shadows, spacing } from '../../../theme';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Tutup saat backdrop ditekan. Default true. */
  closeOnBackdropPress?: boolean;
}

// Modal dasar: card di tengah layar di atas backdrop gelap. Jadi fondasi
// untuk AlertDialog. Untuk sheet dari bawah, lihat ActionSheet.
export function Modal({ isOpen, onClose, children, closeOnBackdropPress = true }: ModalProps) {
  return (
    <RNModal visible={isOpen} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        style={styles.backdrop}
        onPress={closeOnBackdropPress ? onClose : undefined}
      >
        <Pressable style={styles.card} onPress={() => {}}>
          {children}
        </Pressable>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    padding: spacing.lg,
    ...shadows.lg,
  },
});
