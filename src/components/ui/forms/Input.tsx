import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import type { ReactNode } from 'react';
import type { TextInput as RNTextInputRef, TextInputProps } from 'react-native';

import { colors, fontFamily, fontSizes, radii, spacing } from '../../../theme';

export interface InputProps extends TextInputProps {
  isInvalid?: boolean;
  isDisabled?: boolean;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
}

// Input teks standar. Bungkus dengan <FormControl> untuk label/helper/error.
export const Input = forwardRef<RNTextInputRef, InputProps>(function Input(
  { isInvalid, isDisabled, leftElement, rightElement, style, editable, ...rest },
  ref,
) {
  const [focused, setFocused] = useState(false);
  const disabled = isDisabled ?? editable === false;

  return (
    <View
      style={[
        styles.container,
        focused && styles.focused,
        isInvalid && styles.invalid,
        disabled && styles.disabled,
      ]}
    >
      {leftElement}
      <TextInput
        ref={ref}
        editable={!disabled}
        placeholderTextColor={colors.text.muted}
        style={[styles.input, style]}
        onFocus={(e) => {
          setFocused(true);
          rest.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          rest.onBlur?.(e);
        }}
        {...rest}
      />
      {rightElement}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  input: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    fontFamily,
    fontSize: fontSizes.base,
    color: colors.text.primary,
  },
  focused: { borderColor: colors.primary[600] },
  invalid: { borderColor: colors.error[600] },
  disabled: { backgroundColor: colors.surface, opacity: 0.6 },
});
