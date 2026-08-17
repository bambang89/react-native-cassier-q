import { View } from 'react-native';
import type { ViewProps } from 'react-native';

import { radii } from '@/theme';
import type { RadiusToken } from '@/theme';
import { resolveSpacingStyle } from './spacingProps';
import type { SpacingProps } from './spacingProps';

export interface BoxProps extends ViewProps, SpacingProps {
  bg?: string;
  rounded?: RadiusToken;
  borderWidth?: number;
  borderColor?: string;
  flex?: number;
}

// Box adalah primitif layout paling dasar — View biasa + shorthand spacing
// (p/px/py/m/...) & token style (bg/rounded) supaya kebutuhan layout
// sederhana tidak perlu StyleSheet.create sendiri-sendiri di tiap layar.
// Semua primitif lain di folder ini (Flex, HStack, VStack, Center, Square,
// Circle, Container) dibangun di atas Box.
export function Box({
  bg,
  rounded,
  borderWidth,
  borderColor,
  flex,
  p,
  px,
  py,
  pt,
  pb,
  pl,
  pr,
  m,
  mx,
  my,
  mt,
  mb,
  ml,
  mr,
  style,
  ...rest
}: BoxProps) {
  const spacingStyle = resolveSpacingStyle({ p, px, py, pt, pb, pl, pr, m, mx, my, mt, mb, ml, mr });

  return (
    <View
      style={[
        spacingStyle,
        bg ? { backgroundColor: bg } : null,
        rounded ? { borderRadius: radii[rounded] } : null,
        borderWidth ? { borderWidth, borderColor: borderColor ?? '#00000000' } : null,
        flex !== undefined ? { flex } : null,
        style,
      ]}
      {...rest}
    />
  );
}
