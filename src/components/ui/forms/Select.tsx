import { Fragment, useState } from 'react';
import { FlatList, Keyboard, Modal, Pressable as RNPressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  /** Judul sheet pilihan; default memakai placeholder. */
  title?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
}

export function Select<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = 'Pilih...',
  title,
  isDisabled,
  isInvalid,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const insets = useSafeAreaInsets();
  const selected = options.find((o) => o.value === value);

  return (
    <Fragment>
      <Pressable
        disabled={isDisabled}
        onPress={() => {
          // Tutup keyboard dulu supaya sheet tidak muncul setengah saat input lain masih fokus.
          Keyboard.dismiss();
          setOpen(true);
        }}
        style={[styles.field, isInvalid && styles.invalid, isDisabled && styles.disabled]}
        accessibilityRole="button"
      >
        <Text size="base" color={selected ? 'primary' : 'muted'} numberOfLines={1} style={styles.fieldText}>
          {selected ? selected.label : placeholder}
        </Text>
        <Text size="sm" color="muted">▾</Text>
      </Pressable>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
        statusBarTranslucent
        navigationBarTranslucent
        supportedOrientations={['portrait', 'landscape-left', 'landscape-right']}
      >
        <RNPressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* SafeAreaView bawaan RN tidak berefek di Android; inset bawah dipasang manual
              supaya opsi terakhir tidak tertutup navigation bar (edge-to-edge). */}
          <View
            style={[styles.sheet, { paddingBottom: insets.bottom }]}
            onStartShouldSetResponder={() => true}
          >
            <View style={styles.handle} />
            <Text weight="semibold" size="lg" align="center" style={styles.title}>
              {title ?? placeholder}
            </Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              style={styles.list}
              ListEmptyComponent={
                <Text size="sm" color="muted" align="center" style={styles.empty}>
                  Belum ada pilihan
                </Text>
              }
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
    // Tinggi minimum supaya sheet dengan sedikit pilihan tidak tampak seperti
    // potongan kecil di dasar layar.
    minHeight: '40%',
    maxHeight: '70%',
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radii.full,
    backgroundColor: colors.gray[300],
    marginBottom: spacing.sm,
  },
  title: { marginBottom: spacing.xs },
  list: { paddingBottom: spacing.sm },
  empty: { paddingVertical: spacing.lg },
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
