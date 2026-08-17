import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { colors, spacing } from '@/theme';
import { Text } from '@/components/ui/typography/Text';

export interface FormControlProps {
  label?: string;
  helperText?: string;
  errorText?: string;
  isInvalid?: boolean;
  isRequired?: boolean;
  children: ReactNode;
}

export function FormControl({
  label,
  helperText,
  errorText,
  isInvalid = false,
  isRequired = false,
  children,
}: FormControlProps) {
  const showError = isInvalid && !!errorText;

  return (
    <View style={styles.container}>
      {label ? (
        <Text size="base" weight="semibold" style={styles.label}>
          {label}
          {isRequired ? <Text color="error"> *</Text> : null}
        </Text>
      ) : null}

      {children}

      {showError ? (
        <Text size="sm" color="error" style={styles.helper}>
          {errorText}
        </Text>
      ) : helperText ? (
        <Text size="sm" color="secondary" style={styles.helper}>
          {helperText}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: spacing.base },
  label: { marginBottom: spacing.xs, color: colors.text.primary },
  helper: { marginTop: spacing.xs },
});
