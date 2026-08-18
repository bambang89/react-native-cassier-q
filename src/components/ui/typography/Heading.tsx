import { fontSizes, headingFontFamilies, lineHeights } from '@/theme';
import { Text } from './Text';
import type { TextProps } from './Text';

const HEADING_SIZES = {
  h1: '5xl',
  h2: '4xl',
  h3: '3xl',
  h4: '2xl',
  h5: 'xl',
  h6: 'lg',
} as const;

export interface HeadingProps extends Omit<TextProps, 'size'> {
  level?: keyof typeof HEADING_SIZES;
}

// Heading pakai Poppins (bukan Inter seperti Text biasa) sesuai brand
// presentation — h1-h3 di sana eksplisit di-set font-family Poppins.
export function Heading({ level = 'h3', weight = 'bold', style, ...rest }: HeadingProps) {
  const size = HEADING_SIZES[level];
  return (
    <Text
      size={size}
      weight={weight}
      style={[
        { fontFamily: headingFontFamilies[weight], lineHeight: Math.round(fontSizes[size] * lineHeights.tight) },
        style,
      ]}
      {...rest}
    />
  );
}
