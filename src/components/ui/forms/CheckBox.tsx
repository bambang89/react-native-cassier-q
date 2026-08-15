import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { colors, radii, spacing } from '../../../theme';
import { Text } from '../typography/Text';
import { Pressable } from './Pressable';

export interface CheckBoxProps {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: ReactNode;
  isDisabled?: boolean;
  isInvalid?: boolean;
}

// Tidak pakai `expo-checkbox` (belum jadi dependency project) supaya kotak
// centang tetap konsisten dengan token warna/radius di theme kita sendiri.
export function CheckBox({ value, onChange, label, isDisabled, isInvalid }: CheckBoxProps) {
  return (
    <Pressable
      disabled={isDisabled}
      onPress={() => onChange(!value)}
      style={styles.row}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: value, disabled: isDisabled }}
    >
      <View
        style={[
          styles.box,
          value && styles.boxChecked,
          isInvalid && !value && styles.boxInvalid,
        ]}
      >
        {value ? <View style={styles.check} /> : null}
      </View>
      {label ? (
        typeof label === 'string' ? (
          <Text size="base" style={styles.label}>
            {label}
          </Text>
        ) : (
          label
        )
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  box: {
    width: 20,
    height: 20,
    borderRadius: radii.sm,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  boxChecked: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
  boxInvalid: { borderColor: colors.error[600] },
  check: { width: 10, height: 6, borderLeftWidth: 2, borderBottomWidth: 2, borderColor: colors.white, transform: [{ rotate: '-45deg' }, { translateY: -1 }] },
  label: { flexShrink: 1 },
});
