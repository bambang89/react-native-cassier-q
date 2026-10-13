import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/navigation/types';
import { colors } from '@/theme';
import { AppBar } from '@/components/ui/recipes';

import { CheckoutSettingsForm } from './CheckoutSettingsForm';

type Props = NativeStackScreenProps<RootStackParamList, 'CheckoutSettings'>;

/** Phone screen for payment-method and PPN settings. */
export default function CheckoutSettingsScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <AppBar title="Pembayaran & PPN" onBack={navigation.goBack} />
      <CheckoutSettingsForm />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.canvas } });
