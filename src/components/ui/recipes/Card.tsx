import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { colors, radii, shadows, spacing } from '@/theme';
import type { ShadowToken } from '@/theme';
import { Pressable } from '@/components/ui/forms/Pressable';

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  padding?: keyof typeof spacing;
  shadow?: ShadowToken;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, onPress, padding = 'base', shadow = 'sm', style }: CardProps) {
  const content = [styles.base, { padding: spacing[padding] }, shadows[shadow], style];

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={content}>
        {children}
      </Pressable>
    );
  }
  return <View style={content}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.background,
    borderRadius: radii.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});
