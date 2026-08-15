import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { ReactNode } from 'react';

import { colors, radii, shadows, spacing } from '@/theme';
import { Pressable as UiPressable } from '@/components/ui/forms/Pressable';
import { Text } from '@/components/ui/typography/Text';

export interface ActionSheetAction {
  key: string;
  label: string;
  onPress: () => void;
  isDestructive?: boolean;
}

export interface ActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  actions?: ActionSheetAction[];
  children?: ReactNode;
}

export function ActionSheet({ isOpen, onClose, title, actions, children }: ActionSheetProps) {
  return (
    <Modal visible={isOpen} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.handle} />
            {title ? (
              <Text weight="semibold" size="lg" style={styles.title}>
                {title}
              </Text>
            ) : null}

            {children}

            {actions?.map((action) => (
              <UiPressable key={action.key} onPress={action.onPress} style={styles.action}>
                <Text size="base" color={action.isDestructive ? 'error' : 'primary'} align="center">
                  {action.label}
                </Text>
              </UiPressable>
            ))}

            <UiPressable onPress={onClose} style={[styles.action, styles.cancel]}>
              <Text size="base" weight="semibold" align="center">
                Batal
              </Text>
            </UiPressable>
          </SafeAreaView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    ...shadows.lg,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.gray[300],
    marginBottom: spacing.sm,
  },
  title: { textAlign: 'center', marginBottom: spacing.sm },
  action: { paddingVertical: spacing.md, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  cancel: { marginTop: spacing.xs },
});
