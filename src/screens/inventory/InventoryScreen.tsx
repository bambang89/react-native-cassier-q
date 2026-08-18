import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme';
import { EmptyState, Header } from '@/components/ui/recipes';

// Belum ada API stok opname/mutasi gudang terpisah dari data produk — layar
// ini jadi tempat nampung menu "Inventori" di sidebar sampai fiturnya benar-benar dibangun.
export default function InventoryScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header title="Inventori" subtitle="Stok opname & mutasi gudang" />
      <EmptyState
        icon="🗄️"
        title="Segera Hadir"
        description="Pencatatan stok opname dan mutasi antar gudang/outlet akan tampil di sini."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
