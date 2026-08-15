import { StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../../theme';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  spacingY?: keyof typeof spacing;
}

export function Divider({ orientation = 'horizontal', spacingY = 'none' }: DividerProps) {
  if (orientation === 'vertical') {
    return <View style={styles.vertical} />;
  }
  return <View style={[styles.horizontal, { marginVertical: spacing[spacingY] }]} />;
}

const styles = StyleSheet.create({
  horizontal: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, width: '100%' },
  vertical: { width: StyleSheet.hairlineWidth, backgroundColor: colors.border, alignSelf: 'stretch' },
});
