import { Pressable as RNPressable } from 'react-native';
import type { PressableProps as RNPressableProps, StyleProp, ViewStyle } from 'react-native';

import { colors } from '../../../theme';

export interface PressableProps extends Omit<RNPressableProps, 'style'> {
  style?: StyleProp<ViewStyle>;
  /** Opacity dipakai saat ditekan (iOS-style feedback), default 0.7. */
  pressedOpacity?: number;
  /** Ripple Android, aktif secara default dengan warna netral. */
  disableRipple?: boolean;
}

// Pressable dasar dipakai sebagai fondasi Button/Link/CheckBox/Radio dsb
// supaya semua elemen yang bisa ditekan punya feedback visual yang seragam.
export function Pressable({
  style,
  pressedOpacity = 0.7,
  disableRipple,
  disabled,
  android_ripple,
  ...rest
}: PressableProps) {
  return (
    <RNPressable
      disabled={disabled}
      android_ripple={disableRipple ? undefined : (android_ripple ?? { color: colors.gray[200] })}
      style={(state) => [
        { opacity: disabled ? 0.5 : state.pressed ? pressedOpacity : 1 },
        style,
      ]}
      {...rest}
    />
  );
}
