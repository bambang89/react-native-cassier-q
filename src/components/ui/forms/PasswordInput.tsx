import { forwardRef, useState } from 'react';
import type { TextInput as RNTextInputRef } from 'react-native';

import { colors } from '@/theme';
import { Input } from './Input';
import type { InputProps } from './Input';
import { Pressable } from './Pressable';
import { EyeIcon, EyeOffIcon } from '@/components/icons/LineIcons';

export type PasswordInputProps = Omit<InputProps, 'secureTextEntry' | 'rightElement'>;

export const PasswordInput = forwardRef<RNTextInputRef, PasswordInputProps>(function PasswordInput(
  props,
  ref,
) {
  const [visible, setVisible] = useState(false);

  return (
    <Input
      ref={ref}
      secureTextEntry={!visible}
      // Landscape-only app: iOS's Password AutoFill/Keychain suggestion UI is
      // portrait-only and crashes the app on presentation if left enabled here.
      textContentType="none"
      rightElement={
        <Pressable
          onPress={() => setVisible((prev) => !prev)}
          hitSlop={8}
          accessibilityLabel={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
        >
          {visible ? (
            <EyeOffIcon size={18} color={colors.text.muted} />
          ) : (
            <EyeIcon size={18} color={colors.text.muted} />
          )}
        </Pressable>
      }
      {...props}
    />
  );
});
