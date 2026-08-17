import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme';
import { EmptyState, Header } from '@/components/ui/recipes';

// Belum ada API/tabel pengeluaran di backend — layar ini jadi tempat nampung
// menu "Pengeluaran" di sidebar sampai fiturnya benar-benar dibangun.
export default function ExpensesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header title="Pengeluaran" subtitle="Catat biaya operasional toko" />
      <EmptyState
        icon="💸"
        title="Segera Hadir"
        description="Fitur pencatatan pengeluaran toko masih dalam pengembangan."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
