import { Fragment, cloneElement, isValidElement, useRef, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import type { ReactElement } from 'react';

import { colors, radii, spacing } from '@/theme';
import { Text } from '@/components/ui/typography/Text';

export interface TooltipProps {
  label: string;
  children: ReactElement;
  duration?: number;
}

interface Anchor {
  x: number;
  y: number;
  width: number;
}

export function Tooltip({ label, children, duration = 1500 }: TooltipProps) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const triggerRef = useRef<View>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = () => {
    triggerRef.current?.measureInWindow((x, y, width) => {
      setAnchor({ x, y, width });
      if (hideTimer.current) clearTimeout(hideTimer.current);
      hideTimer.current = setTimeout(() => setAnchor(null), duration);
    });
  };

  if (!isValidElement(children)) return null;

  // Ref ditaruh di View pembungkus (bukan di-clone ke trigger) supaya tidak
  // bergantung pada trigger meneruskan ref ke node native-nya.
  const triggerElement = (
    <View ref={triggerRef} collapsable={false}>
      {cloneElement(children as ReactElement<{ onLongPress?: () => void }>, { onLongPress: show })}
    </View>
  );

  return (
    <Fragment>
      {triggerElement}
      <Modal visible={!!anchor} transparent animationType="fade">
        {anchor ? (
          <View style={[styles.bubble, { top: anchor.y - 36, left: Math.max(anchor.x, spacing.sm) }]}>
            <Text size="xs" style={styles.text}>
              {label}
            </Text>
          </View>
        ) : null}
      </Modal>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    backgroundColor: colors.gray[900],
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    maxWidth: 220,
  },
  text: { color: colors.white },
});
