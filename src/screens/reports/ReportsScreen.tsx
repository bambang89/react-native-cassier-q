import { StyleSheet, Text, View } from 'react-native';

export default function ReportsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Laporan Penjualan</Text>
      <Text style={styles.placeholder}>
        Dashboard grafik penjualan, produk terlaris, dan breakdown metode pembayaran akan tampil
        di sini setelah endpoint /reports tersedia.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12 },
  placeholder: { color: '#999' },
});
