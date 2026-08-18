import { Alert, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { colors, radii, spacing } from '@/theme';
import { Pressable } from '@/components/ui/forms/Pressable';
import { BellIcon, ChevronDownIcon, StoreIcon } from '@/components/icons/LineIcons';
import { Heading, Text } from '@/components/ui/typography';

export interface TabletTopBarProps {
  title: string;
  subtitle: string;
  storeName: string;
  userName: string;
  /** Slot ekstra di kiri outlet-pill, mis. tombol "+ Tambah" di layar Produk. */
  rightAction?: ReactNode;
  onNotificationPress?: () => void;
}

// Top bar mode tablet-landscape — struktur persis .tablet-topbar di
// cassier-q-webapp (title+sub kiri, outlet-pill + bell + avatar kanan).
// Dipakai di Kasir, Dashboard, Produk, dst supaya konsisten satu tempat.
export function TabletTopBar({
  title,
  subtitle,
  storeName,
  userName,
  rightAction,
  onNotificationPress,
}: TabletTopBarProps) {
  return (
    <View style={styles.topBar}>
      <View>
        <Heading level="h3">{title}</Heading>
        <Text color="secondary" size="sm" style={styles.topBarSubtitle}>
          {subtitle}
        </Text>
      </View>
      <View style={styles.topBarRight}>
        {rightAction}
        <Pressable
          style={styles.outletChip}
          onPress={() => Alert.alert('Segera hadir', 'Fitur ganti outlet belum tersedia.')}
        >
          <StoreIcon size={14} color={colors.text.secondary} />
          <Text size="sm" weight="semibold" numberOfLines={1} style={styles.outletChipLabel}>
            {storeName}
          </Text>
          <ChevronDownIcon size={14} color={colors.text.muted} />
        </Pressable>
        <Pressable
          style={styles.iconButton}
          accessibilityLabel="Notifikasi"
          onPress={onNotificationPress ?? (() => Alert.alert('Notifikasi', 'Belum ada notifikasi baru.'))}
        >
          <BellIcon size={17} color={colors.text.secondary} />
        </Pressable>
        <View style={styles.avatarCircle}>
          <Text weight="bold" color="inverse" size="sm">
            {userName.charAt(0).toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingTop: spacing.base,
    paddingBottom: spacing.sm,
  },
  topBarSubtitle: { marginTop: 2 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  outletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  outletChipLabel: { maxWidth: 120 },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary[600],
    alignItems: 'center',
    justifyContent: 'center',
  },
});
