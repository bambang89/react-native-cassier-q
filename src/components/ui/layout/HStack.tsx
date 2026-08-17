import type { SpacingToken } from '@/theme';
import { Flex } from './Flex';
import type { FlexProps } from './Flex';

export interface HStackProps extends Omit<FlexProps, 'direction'> {
  /** Alias `gap`, penamaan ala NativeBase. */
  space?: SpacingToken;
}

// Baris horizontal — dipakai jauh lebih sering daripada Flex generik, mis.
// baris ikon+label, tombol berjejer, item list.
export function HStack({ space, gap, ...rest }: HStackProps) {
  return <Flex direction="row" gap={gap ?? space} {...rest} />;
}
