import { Linking, StyleSheet } from 'react-native';

import { colors } from '../../../theme';
import { Text } from '../typography/Text';
import type { TextProps } from '../typography/Text';
import { Pressable } from './Pressable';

export interface LinkProps extends TextProps {
  href?: string;
  onPress?: () => void;
}

// Teks yang bisa ditekan, dipakai untuk navigasi antar layar (mis. "Belum
// punya akun? Daftar") atau membuka URL eksternal lewat `href`.
export function Link({ href, onPress, style, children, ...rest }: LinkProps) {
  const handlePress = () => {
    if (href) Linking.openURL(href);
    onPress?.();
  };

  return (
    <Pressable onPress={handlePress} accessibilityRole="link">
      <Text color="link" style={[styles.text, style]} {...rest}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: { textDecorationLine: 'underline', color: colors.primary[600] },
});
