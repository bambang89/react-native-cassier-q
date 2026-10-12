import { StyleSheet, Text as RNText } from 'react-native';
import type { TextProps as RNTextProps, TextStyle } from 'react-native';

import { colors, fontFamilies, fontFamilyForWeight, fontSizes, lineHeights } from '@/theme';
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
  // Bobot dari style (fontWeight) diterjemahkan ke file font Plus Jakarta Sans
  // yang sesuai, jadi semua teks tetap satu keluarga font walau layar menulis
  // fontWeight sendiri.
  const flat = StyleSheet.flatten(style) ?? {};
  const { fontWeight: styleWeight, fontFamily: styleFamily, ...restStyle } = flat;
  const family =
    styleFamily && styleFamily.startsWith('PlusJakartaSans')
      ? styleFamily
      : styleWeight !== undefined
        ? fontFamilyForWeight(styleWeight)
        : fontFamilies[weight];

  return (
    <RNText
      style={[
        {
          fontSize: fontSizes[size],
          lineHeight: Math.round(fontSizes[size] * lineHeights.normal),
          color: resolveColor(color),
          fontStyle: italic ? 'italic' : 'normal',
          textAlign: align,
          fontVariant: TABULAR_NUMS,
        },
        restStyle,
        { fontFamily: family },
      ]}
      {...rest}
    />
  );
}

// Angka tabular: setiap digit sama lebar, jadi kolom harga/total rata.
const TABULAR_NUMS: TextStyle['fontVariant'] = ['tabular-nums'];
