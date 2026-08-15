import { Fragment } from 'react';
import { StyleSheet } from 'react-native';
import type { ReactElement } from 'react';

import { spacing } from '../../../theme';
import { Pressable } from '../forms/Pressable';
import { Divider } from '../dataDisplay/Divider';
import { Text } from '../typography/Text';
import { Popover } from './Popover';

export interface MenuItemConfig {
  key: string;
  label: string;
  onPress: () => void;
  isDestructive?: boolean;
  isDisabled?: boolean;
}

export interface MenuProps {
  trigger: ReactElement;
  items: MenuItemConfig[];
  placement?: 'top' | 'bottom';
}

// Menu dropdown untuk aksi kontekstual (mis. tombol "..." di baris produk:
// Edit / Duplikat / Hapus). Dibangun di atas Popover.
export function Menu({ trigger, items, placement = 'bottom' }: MenuProps) {
  return (
    <Popover trigger={trigger} placement={placement}>
      {items.map((item, index) => (
        <Fragment key={item.key}>
          {index > 0 ? <Divider spacingY="xs" /> : null}
          <Pressable
            disabled={item.isDisabled}
            onPress={item.onPress}
            style={styles.item}
            accessibilityRole="menuitem"
          >
            <Text
              size="base"
              color={item.isDestructive ? 'error' : 'primary'}
              style={item.isDisabled && styles.disabled}
            >
              {item.label}
            </Text>
          </Pressable>
        </Fragment>
      ))}
    </Popover>
  );
}

const styles = StyleSheet.create({
  item: { paddingVertical: spacing.sm, paddingHorizontal: spacing.xs },
  disabled: { opacity: 0.4 },
});
