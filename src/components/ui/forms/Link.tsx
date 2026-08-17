import { Linking, StyleSheet } from 'react-native';

import { colors } from '@/theme';
import { Text } from '@/components/ui/typography/Text';
import type { TextProps } from '@/components/ui/typography/Text';
import { Pressable } from './Pressable';

export interface LinkProps extends TextProps {
  href?: string;
  onPress?: () => void;
}

export function Link({ href, onPress, style, children, ...rest }: LinkProps) {
  const handlePress = () => {
    if (href) Linking.openURL(href);
    onPress?.();
  };

  return (
    // hitSlop (bukan padding) biar area sentuh lebih lega tanpa mengubah
    // layout di sekitar link (mis. dijejer dengan tombol lain di header).
    <Pressable onPress={handlePress} hitSlop={10} accessibilityRole="link">
      <Text color="link" style={[styles.text, style]} {...rest}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: { textDecorationLine: 'underline', color: colors.primary[600] },
});
