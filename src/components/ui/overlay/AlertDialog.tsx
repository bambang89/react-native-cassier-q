import { StyleSheet, View } from 'react-native';

import { spacing } from '../../../theme';
import { Button } from '../forms/Button';
import { Heading } from '../typography/Heading';
import { Text } from '../typography/Text';
import { Modal } from './Modal';

export interface AlertDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  isDanger?: boolean;
  isConfirmLoading?: boolean;
}

// Dialog konfirmasi generik (mis. "Batalkan pesanan?", "Hapus produk?").
// Menggantikan pola `Alert.alert(...)` bawaan RN dengan tampilan yang bisa
// dikustomisasi dan konsisten dengan theme.
export function AlertDialog({
  isOpen,
  onClose,
  title,
  description,
  confirmText = 'Konfirmasi',
  cancelText = 'Batal',
  onConfirm,
  isDanger = false,
  isConfirmLoading = false,
}: AlertDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} closeOnBackdropPress={!isConfirmLoading}>
      <Heading level="h5">{title}</Heading>
      {description ? (
        <Text color="secondary" style={styles.description}>
          {description}
        </Text>
      ) : null}
      <View style={styles.actions}>
        <Button variant="ghost" onPress={onClose} disabled={isConfirmLoading} style={styles.action}>
          {cancelText}
        </Button>
        <Button
          variant={isDanger ? 'danger' : 'solid'}
          onPress={onConfirm}
          loading={isConfirmLoading}
          style={styles.action}
        >
          {confirmText}
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  description: { marginTop: spacing.sm },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.lg },
  action: { minWidth: 90 },
});
