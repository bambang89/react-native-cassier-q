import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { spacing } from '../../../theme';
import { Heading } from '../typography/Heading';
import { Text } from '../typography/Text';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: ReactNode;
}

// Header konten halaman (bukan bar navigasi) — dipakai di atas daftar/isi
// layar, mis. judul "Produk" di ProductsScreen atau "Kasir" di POSScreen,
// dengan slot aksi opsional di kanan (mis. tombol "Scan Barcode").
export function Header({ title, subtitle, rightElement }: HeaderProps) {
  return (
    <View style={styles.container}>
      <View style={styles.textGroup}>
        <Heading level="h3">{title}</Heading>
        {subtitle ? (
          <Text color="secondary" size="sm" style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {rightElement}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.base,
  },
  textGroup: { flexShrink: 1 },
  subtitle: { marginTop: 2 },
});
