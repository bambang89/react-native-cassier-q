import { Text as RNText } from 'react-native';
import type { TextProps as RNTextProps, TextStyle } from 'react-native';

import { colors, fontFamily, fontSizes, fontWeights, lineHeights } from '../../../theme';
import type { FontSizeToken, FontWeightToken } from '../../../theme';

export type TextColorToken = keyof typeof colors.text | 'success' | 'warning' | 'error';

export interface TextProps extends RNTextProps {
  size?: FontSizeToken;
  weight?: FontWeightToken;
  color?: TextColorToken;
  italic?: boolean;
  align?: TextStyle['textAlign'];
}

function resolveColor(color: TextColorToken): string {
  switch (color) {
    case 'success':
      return colors.success[600];
    case 'warning':
      return colors.warning[700];
    case 'error':
      return colors.text.danger;
    default:
      return colors.text[color];
  }
}

// Komponen Text dasar: semua teks di app sebaiknya lewat sini (bukan RN
// Text langsung) supaya ukuran/berat/warna selalu konsisten dengan theme.
export function Text({
  size = 'base',
  weight = 'regular',
  color = 'primary',
  italic,
  align,
  style,
  ...rest
}: TextProps) {
  return (
    <RNText
      style={[
        {
          fontFamily,
          fontSize: fontSizes[size],
          fontWeight: fontWeights[weight],
          lineHeight: Math.round(fontSizes[size] * lineHeights.normal),
          color: resolveColor(color),
          fontStyle: italic ? 'italic' : 'normal',
          textAlign: align,
        },
        style,
      ]}
      {...rest}
    />
  );
}
