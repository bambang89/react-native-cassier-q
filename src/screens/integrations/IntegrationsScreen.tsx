import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme';
import { EmptyState, Header } from '@/components/ui/recipes';

// Belum ada API integrasi pihak ketiga — layar ini jadi tempat nampung
// menu "Integrasi" di sidebar sampai fiturnya benar-benar dibangun.
export default function IntegrationsScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header title="Integrasi" subtitle="Hubungkan layanan pihak ketiga" />
      <EmptyState
        icon="🔌"
        title="Segera Hadir"
        description="Integrasi dengan layanan pembayaran, marketplace, dan pihak ketiga lainnya akan tampil di sini."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
