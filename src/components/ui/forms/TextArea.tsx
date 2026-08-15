import { forwardRef } from 'react';
import type { TextInput as RNTextInputRef } from 'react-native';

import { Input } from './Input';
import type { InputProps } from './Input';

export interface TextAreaProps extends Omit<InputProps, 'multiline'> {
  numberOfLines?: number;
}

// TextArea = Input dengan multiline + tinggi minimum, dipakai untuk catatan/deskripsi.
export const TextArea = forwardRef<RNTextInputRef, TextAreaProps>(function TextArea(
  { numberOfLines = 4, style, ...rest },
  ref,
) {
  return (
    <Input
      ref={ref}
      multiline
      numberOfLines={numberOfLines}
      textAlignVertical="top"
      style={[{ minHeight: numberOfLines * 20, paddingTop: 10 }, style]}
      {...rest}
    />
  );
});
