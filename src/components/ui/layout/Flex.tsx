import type { ViewStyle } from 'react-native';

import { spacing } from '@/theme';
import type { SpacingToken } from '@/theme';
import { Box } from './Box';
import type { BoxProps } from './Box';

export interface FlexProps extends BoxProps {
  direction?: ViewStyle['flexDirection'];
  wrap?: ViewStyle['flexWrap'];
  justify?: ViewStyle['justifyContent'];
  align?: ViewStyle['alignItems'];
  gap?: SpacingToken;
}

// Flex = Box + kontrol flexbox (direction/wrap/justify/align/gap) dalam satu
// baris props, dibanding nulis style flexbox manual tiap kali.
export function Flex({ direction = 'row', wrap, justify, align, gap, style, ...rest }: FlexProps) {
  return (
    <Box
      style={[
        {
          flexDirection: direction,
          flexWrap: wrap,
          justifyContent: justify,
          alignItems: align,
          gap: gap !== undefined ? spacing[gap] : undefined,
        },
        style,
      ]}
      {...rest}
    />
  );
}
