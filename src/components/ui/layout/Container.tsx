import { spacing } from '@/theme';
import { Box } from './Box';
import type { BoxProps } from './Box';

export interface ContainerProps extends BoxProps {
  /** Lebar maksimum konten, di-center kalau layar lebih lebar (mis. tablet/web). Default 480. */
  maxWidth?: number;
}

// Pembatas lebar + padding horizontal default + auto-center — dipakai
// membungkus konten utama layar supaya tidak melebar aneh di tablet/web,
// dan supaya semua layar punya padding tepi yang konsisten.
export function Container({ maxWidth = 480, style, ...rest }: ContainerProps) {
  return (
    <Box
      style={[{ width: '100%', maxWidth, alignSelf: 'center', paddingHorizontal: spacing.base }, style]}
      {...rest}
    />
  );
}
