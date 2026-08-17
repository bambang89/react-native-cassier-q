import { ActivityIndicator, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';

import { colors, radii, shadows, spacing } from '@/theme';
import { Text } from '@/components/ui/typography/Text';
import { Pressable } from './Pressable';
import type { PressableProps } from './Pressable';

export type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'danger' | 'dangerOutline';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

// Tinggi minimum dijaga ≥44-48dp (target sentuh nyaman, terutama buat
// pengguna 30-50+ yang butuh area jempol lebih lega) lewat kombinasi
// paddingVertical + minHeight, bukan cuma padding sendirian.
const SIZE_STYLES: Record<
  ButtonSize,
  { paddingVertical: number; paddingHorizontal: number; minHeight: number; fontSize: 'sm' | 'base' | 'lg' }
> = {
  sm: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md, minHeight: 40, fontSize: 'sm' },
  md: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg, minHeight: 48, fontSize: 'base' },
  lg: { paddingVertical: spacing.md + 2, paddingHorizontal: spacing.xl, minHeight: 56, fontSize: 'lg' },
};

function variantStyle(variant: ButtonVariant): { container: ViewStyle; textColor: 'inverse' | 'primary' | 'danger' } {
  switch (variant) {
    case 'outline':
      return {
        container: {
          backgroundColor: colors.transparent,
          borderWidth: 1.5,
          borderColor: colors.primary[600],
        },
        textColor: 'primary',
      };
    case 'ghost':
      return { container: { backgroundColor: colors.transparent }, textColor: 'primary' };
    case 'danger':
      // Sedikit shadow biar tombol "solid" kelihatan bisa ditekan, bukan cuma blok warna datar.
      return { container: { backgroundColor: colors.error[600], ...shadows.sm }, textColor: 'inverse' };
    case 'dangerOutline':
      return {
        container: {
          backgroundColor: colors.transparent,
          borderWidth: 1.5,
          borderColor: colors.error[600],
        },
        textColor: 'danger',
      };
    case 'solid':
    default:
      return { container: { backgroundColor: colors.primary[600], ...shadows.sm }, textColor: 'inverse' };
  }
}

// Button jadi satu-satunya tombol utama yang dipakai di seluruh app
// (menggantikan pola `<Pressable style={styles.button}>` manual di tiap layar).
export function Button({
  children,
  variant = 'solid',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  style,
  ...rest
}: ButtonProps) {
  const { paddingVertical, paddingHorizontal, minHeight, fontSize } = SIZE_STYLES[size];
  const { container, textColor } = variantStyle(variant);
  const isDisabled = disabled || loading;
  const labelColor = textColor === 'primary' ? colors.primary[600] : textColor === 'danger' ? colors.text.danger : colors.text.inverse;

  return (
    <Pressable
      disabled={isDisabled}
      style={[
        styles.base,
        container,
        { paddingVertical, paddingHorizontal, minHeight, width: fullWidth ? '100%' : undefined },
        style,
      ]}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={labelColor} />
      ) : (
        <View style={styles.content}>
          {leftIcon}
          <Text size={fontSize} weight="semibold" style={{ color: labelColor }}>
            {children}
          </Text>
          {rightIcon}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
});
