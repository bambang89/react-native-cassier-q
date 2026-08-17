import { Flex } from './Flex';
import type { FlexProps } from './Flex';

export type CenterProps = Omit<FlexProps, 'justify' | 'align'>;

// Nge-center isi di kedua sumbu — dipakai buat loading/empty state, ikon di
// tengah lingkaran, dll. Ganti pola `justifyContent+alignItems: 'center'` manual.
export function Center(props: CenterProps) {
  return <Flex justify="center" align="center" {...props} />;
}
