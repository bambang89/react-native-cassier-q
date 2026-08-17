import type { SpacingToken } from '@/theme';
import { Flex } from './Flex';
import type { FlexProps } from './Flex';

export interface VStackProps extends Omit<FlexProps, 'direction'> {
  /** Alias `gap`, penamaan ala NativeBase. */
  space?: SpacingToken;
}

// Kolom vertikal — dipakai buat susunan form field, daftar baris, dst.
export function VStack({ space, gap, ...rest }: VStackProps) {
  return <Flex direction="column" gap={gap ?? space} {...rest} />;
}
