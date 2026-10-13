import { StyleSheet, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import type { RootStackParamList } from '@/navigation/types';
import { colors } from '@/theme';
import { AppBar } from '@/components/ui/recipes';

import { BundleList } from './BundleList';

type Props = NativeStackScreenProps<RootStackParamList, 'Bundles'>;

/** Phone screen listing the store's bundles (Kepala Toko). */
export default function BundlesScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <AppBar title="Paket Bundling" onBack={navigation.goBack} />
      <BundleList />
    </View>
  );
}

const styles = StyleSheet.create({ container: { flex: 1, backgroundColor: colors.canvas } });
