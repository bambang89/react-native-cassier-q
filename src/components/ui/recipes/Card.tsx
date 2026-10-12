import { StyleSheet, View } from 'react-native';
import type { StyleProp, ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

import { colors, radii, shadows, spacing } from '@/theme';
import type { ShadowToken } from '@/theme';
import { PressableScale } from '@/components/ui/motion/PressableScale';

export interface CardProps {
  children: ReactNode;
  onPress?: () => void;
  padding?: keyof typeof spacing;
  shadow?: ShadowToken;
  style?: StyleProp<ViewStyle>;
}

export function Card({ children, onPress, padding = 'base', shadow = 'card', style }: CardProps) {
  const content = [styles.base, { padding: spacing[padding] }, shadows[shadow], style];

  if (onPress) {
    return (
      <PressableScale onPress={onPress} activeScale={0.985} style={content}>
        {children}
      </PressableScale>
    );
  }
  return <View style={content}>{children}</View>;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.background,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
