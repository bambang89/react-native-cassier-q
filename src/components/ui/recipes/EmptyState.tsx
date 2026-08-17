import { StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { spacing } from '@/theme';
import { Button } from '@/components/ui/forms/Button';
import { Heading } from '@/components/ui/typography/Heading';
import { Text } from '@/components/ui/typography/Text';

export interface EmptyStateProps {
  /** Emoji besar sebagai ilustrasi ringan — tanpa perlu aset gambar, tetap terasa ramah & tidak kosong-hampa. */
  icon: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  children?: ReactNode;
}

// Dipakai di setiap layar daftar (Produk, Transaksi, Kategori, Satuan, dst)
// menggantikan teks datar "Belum ada data" — supaya layar kosong tetap
// terasa hidup dan langsung kasih tahu pengguna harus ngapain.
export function EmptyState({ icon, title, description, actionLabel, onAction, children }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>{icon}</Text>
      <Heading level="h5" align="center" style={styles.title}>
        {title}
      </Heading>
      {description ? (
        <Text color="secondary" align="center" style={styles.description}>
          {description}
        </Text>
      ) : null}
      {actionLabel && onAction ? (
        <Button variant="outline" onPress={onAction} style={styles.action}>
          {actionLabel}
        </Button>
      ) : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, paddingTop: spacing['3xl'] },
  icon: { fontSize: 56, marginBottom: spacing.base },
  title: { marginBottom: spacing.xs },
  description: { maxWidth: 280 },
  action: { marginTop: spacing.lg },
});
