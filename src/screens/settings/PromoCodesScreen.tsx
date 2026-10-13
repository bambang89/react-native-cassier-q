import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/navigation/types';
import { colors } from '@/theme';
import { AppBar } from '@/components/ui/recipes';

import { PromoCodeList } from './PromoCodeList';

type Props = NativeStackScreenProps<RootStackParamList, 'PromoCodes'>;

/** Phone screen listing the store's promo codes. */
export default function PromoCodesScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <AppBar title="Kode Promo" onBack={navigation.goBack} />
      <PromoCodeList />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.canvas } });
