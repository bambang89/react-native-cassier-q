import { cloneElement, isValidElement, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { ReactElement, ReactNode } from 'react';

import { colors, radii, shadows, spacing } from '@/theme';

export interface PopoverProps {
  trigger: ReactElement;
  children: ReactNode;
  placement?: 'top' | 'bottom';
}

interface Anchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

export function Popover({ trigger, children, placement = 'bottom' }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const triggerRef = useRef<View>(null);
  const { width: windowWidth } = useWindowDimensions();

  const open = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, y, width, height });
      setIsOpen(true);
    });
  };

  const close = () => setIsOpen(false);

  if (!isValidElement(trigger)) return null;

  const triggerElement = (
    <View ref={triggerRef} collapsable={false}>
      {cloneElement(trigger as ReactElement<{ onPress?: () => void }>, { onPress: open })}
    </View>
  );

  const ESTIMATED_TOP_OFFSET = 60;
  const top = anchor
    ? placement === 'bottom'
      ? anchor.y + anchor.height + 6
      : anchor.y - ESTIMATED_TOP_OFFSET
    : 0;
  const left = anchor ? Math.min(Math.max(anchor.x, spacing.sm), windowWidth - spacing.sm - 220) : 0;

  return (
    <>
      {triggerElement}
      <Modal visible={isOpen} transparent animationType="fade" onRequestClose={close}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close}>
          {anchor ? (
            <View style={[styles.popover, { top, left }]}>{children}</View>
          ) : null}
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  popover: {
    position: 'absolute',
    minWidth: 160,
    maxWidth: 260,
    backgroundColor: colors.background,
    borderRadius: radii.md,
    padding: spacing.sm,
    ...shadows.md,
  },
});
