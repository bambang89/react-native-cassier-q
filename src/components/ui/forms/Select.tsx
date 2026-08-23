import { Fragment, useState } from 'react';
import { FlatList, Modal, Pressable as RNPressable, SafeAreaView, StyleSheet, View } from 'react-native';

import { colors, radii, spacing } from '@/theme';
import { Text } from '@/components/ui/typography/Text';
import { CheckIcon } from '@/components/icons/LineIcons';
import { Pressable } from './Pressable';

export interface SelectOption<T extends string = string> {
  label: string;
  value: T;
}

export interface SelectProps<T extends string = string> {
  value: T | null;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  placeholder?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
}

export function Select<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Pilih...',
  isDisabled,
  isInvalid,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);

  return (
    <Fragment>
      <Pressable
        disabled={isDisabled}
        onPress={() => setOpen(true)}
        style={[styles.field, isInvalid && styles.invalid, isDisabled && styles.disabled]}
        accessibilityRole="button"
      >
        <Text size="base" color={selected ? 'primary' : 'muted'} numberOfLines={1} style={styles.fieldText}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text size="sm" color="muted">▾</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <RNPressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            <SafeAreaView>
              <FlatList
                data={options}
                keyExtractor={(item) => item.value}
                style={styles.list}
                renderItem={({ item }) => (
                  <Pressable
                    style={styles.option}
                    onPress={() => {
                      onChange(item.value);
                      setOpen(false);
                    }}
                  >
                    <Text size="base" weight={item.value === value ? 'semibold' : 'regular'}>
                      {item.label}
                    </Text>
                    {item.value === value ? <CheckIcon size={16} color={colors.primary[600]} /> : null}
                  </Pressable>
                )}
              />
            </SafeAreaView>
          </View>
        </RNPressable>
      </Modal>
    </Fragment>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  fieldText: { flex: 1, marginRight: spacing.sm },
  invalid: { borderColor: colors.error[600] },
  disabled: { opacity: 0.6 },
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    maxHeight: '60%',
  },
  list: { paddingVertical: spacing.sm },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.base,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
});
