import type { ViewStyle } from 'react-native';

import { spacing } from '@/theme';
import type { SpacingToken } from '@/theme';

// Shorthand ala Box/Chakra (p/px/py/m/mx/...) dipakai bareng di semua
// primitif layout (Box, Flex, HStack, VStack, dst) supaya tidak perlu bikin
// StyleSheet manual buat jarak yang simpel. Nilai tetap dari token spacing
// tema — bukan angka bebas — biar konsisten dengan komponen lain.
export interface SpacingProps {
  p?: SpacingToken;
  px?: SpacingToken;
  py?: SpacingToken;
  pt?: SpacingToken;
  pb?: SpacingToken;
  pl?: SpacingToken;
  pr?: SpacingToken;
  m?: SpacingToken;
  mx?: SpacingToken;
  my?: SpacingToken;
  mt?: SpacingToken;
  mb?: SpacingToken;
  ml?: SpacingToken;
  mr?: SpacingToken;
}

export function resolveSpacingStyle(props: SpacingProps): ViewStyle {
  const style: ViewStyle = {};
  if (props.p !== undefined) style.padding = spacing[props.p];
  if (props.px !== undefined) style.paddingHorizontal = spacing[props.px];
  if (props.py !== undefined) style.paddingVertical = spacing[props.py];
  if (props.pt !== undefined) style.paddingTop = spacing[props.pt];
  if (props.pb !== undefined) style.paddingBottom = spacing[props.pb];
  if (props.pl !== undefined) style.paddingLeft = spacing[props.pl];
  if (props.pr !== undefined) style.paddingRight = spacing[props.pr];
  if (props.m !== undefined) style.margin = spacing[props.m];
  if (props.mx !== undefined) style.marginHorizontal = spacing[props.mx];
  if (props.my !== undefined) style.marginVertical = spacing[props.my];
  if (props.mt !== undefined) style.marginTop = spacing[props.mt];
  if (props.mb !== undefined) style.marginBottom = spacing[props.mb];
  if (props.ml !== undefined) style.marginLeft = spacing[props.ml];
  if (props.mr !== undefined) style.marginRight = spacing[props.mr];
  return style;
}
