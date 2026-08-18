import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme';
import { EmptyState, Header } from '@/components/ui/recipes';
import { ClipboardIcon } from '@/components/icons/LineIcons';

export default function PesananScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <Header title="Pesanan" subtitle="Antrian pesanan masuk" />
      <EmptyState
        icon={ClipboardIcon}
        title="Segera Hadir"
        description="Daftar pesanan yang sedang berjalan akan tampil di sini."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
