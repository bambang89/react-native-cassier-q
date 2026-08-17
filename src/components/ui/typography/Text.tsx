import { Text as RNText } from 'react-native';
import type { TextProps as RNTextProps, TextStyle } from 'react-native';

import { colors, fontFamilies, fontSizes, lineHeights } from '@/theme';
import type { FontSizeToken, FontWeightToken } from '@/theme';

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
          fontFamily: fontFamilies[weight],
          fontSize: fontSizes[size],
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
