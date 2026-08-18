import { StyleSheet, View } from 'react-native';
import type { ComponentType, ReactNode } from 'react';

import { colors, radii, spacing } from '@/theme';
import type { LineIconProps } from '@/components/icons/LineIcons';
import { Button } from '@/components/ui/forms/Button';
import { Heading } from '@/components/ui/typography/Heading';
import { Text } from '@/components/ui/typography/Text';

export interface EmptyStateProps {
  icon: ComponentType<LineIconProps>;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, children }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.glyph}>
        <Icon size={26} color={colors.primary[600]} />
      </View>
      <Heading level="h5" align="center" style={styles.title}>
        {title}
      </Heading>
      {description ? (
        <Text color="secondary" align="center" style={styles.description}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant="outline" onPress={onAction} style={styles.action}>
          {actionLabel}
        </Button>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, paddingTop: spacing['3xl'] },
  glyph: {
    width: 64,
    height: 64,
    borderRadius: radii.xl,
    backgroundColor: colors.primary[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.base,
  },
  title: { marginBottom: spacing.xs },
  description: { maxWidth: 280 },
  action: { marginTop: spacing.lg },
});
