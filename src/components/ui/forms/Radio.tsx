import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../../theme';
import { Text } from '../typography/Text';
import { Pressable } from './Pressable';

export interface RadioOption<T extends string = string> {
  label: string;
  value: T;
}

export interface RadioGroupProps<T extends string = string> {
  value: T | null;
  onChange: (value: T) => void;
  options: RadioOption<T>[];
  isDisabled?: boolean;
  direction?: 'column' | 'row';
}

// RadioGroup: satu komponen yang me-render seluruh pilihan, dipakai
// menggantikan pola "custom radio buttons" yang biasa ditulis manual per layar.
export function RadioGroup<T extends string = string>({
  value,
  onChange,
  options,
  isDisabled,
  direction = 'column',
}: RadioGroupProps<T>) {
  return (
    <View style={[styles.group, direction === 'row' && styles.groupRow]}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <Pressable
            key={option.value}
            disabled={isDisabled}
            onPress={() => onChange(option.value)}
            style={styles.row}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected, disabled: isDisabled }}
          >
            <View style={[styles.outer, selected && styles.outerSelected]}>
              {selected ? <View style={styles.inner} /> : null}
            </View>
            <Text size="base">{option.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  groupRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.base },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  outer: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerSelected: { borderColor: colors.primary[600] },
  inner: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary[600] },
});
