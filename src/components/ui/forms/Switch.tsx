import { Switch as RNSwitch } from 'react-native';
import type { SwitchProps as RNSwitchProps } from 'react-native';

import { colors } from '@/theme';

export interface SwitchProps extends Omit<RNSwitchProps, 'trackColor' | 'thumbColor'> {}

export function Switch(props: SwitchProps) {
  return (
    <RNSwitch
      trackColor={{ false: colors.gray[300], true: colors.primary[400] }}
      thumbColor={props.value ? colors.primary[600] : colors.gray[50]}
      ios_backgroundColor={colors.gray[300]}
      {...props}
    />
  );
}
