import { spacing } from '@/theme';
import { Square } from './Square';
import type { SquareProps } from './Square';

export type CircleProps = SquareProps;

// Square + border-radius penuh — dipakai buat avatar, badge ikon bulat, dot
// status, dll. Lihat ProfileScreen (avatar inisial nama) untuk contoh pemakaian.
export function Circle({ size, style, ...rest }: CircleProps) {
  const resolved = typeof size === 'number' ? size : spacing[size];
  return <Square size={size} style={[{ borderRadius: resolved / 2 }, style]} {...rest} />;
}
