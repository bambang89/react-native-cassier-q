import { forwardRef, useState } from 'react';
import type { TextInput as RNTextInputRef } from 'react-native';

import { Input } from './Input';
import type { InputProps } from './Input';
import { Pressable } from './Pressable';
import { Text } from '@/components/ui/typography/Text';

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
      rightElement={
        <Pressable
          onPress={() => setVisible((prev) => !prev)}
          hitSlop={8}
          accessibilityLabel={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
        >
          <Text size="lg">{visible ? '🙈' : '👁️'}</Text>
        </Pressable>
      }
      {...props}
    />
  );
});
