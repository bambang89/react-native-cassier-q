import type { SpacingToken } from '@/theme';
import { spacing } from '@/theme';
import { Center } from './Center';
import type { CenterProps } from './Center';

export interface SquareProps extends CenterProps {
  /** Angka piksel langsung, atau token spacing (mis. '2xl' = 32px). */
  size: number | SpacingToken;
}

// Kotak berukuran sama sisi dengan isi ter-center — dasar buat wadah ikon,
// avatar kotak, placeholder gambar, dll. Lihat juga Circle (Square + rounded).
export function Square({ size, style, ...rest }: SquareProps) {
  const resolved = typeof size === 'number' ? size : spacing[size];
  return <Center style={[{ width: resolved, height: resolved }, style]} {...rest} />;
}
