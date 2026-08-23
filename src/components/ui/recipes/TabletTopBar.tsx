import { Alert, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';

import { radii } from '@/theme';
import { tabletColors, tabletLayout } from '@/theme/tabletColors';
import { Pressable } from '@/components/ui/forms/Pressable';
import { BellIcon, ChevronDownIcon, StoreIcon } from '@/components/icons/LineIcons';
import { Heading, Text } from '@/components/ui/typography';

export interface TabletTopBarProps {
  title: string;
  subtitle: string;
  storeName: string;
  userName: string;
  rightAction?: ReactNode;
  onNotificationPress?: () => void;
  hasNotification?: boolean;
}

export function TabletTopBar({
  title,
  subtitle,
  storeName,
  userName,
  rightAction,
  onNotificationPress,
  hasNotification,
}: TabletTopBarProps) {
  return (
    <View style={styles.topBar}>
      <View>
        <Heading level="h3" style={styles.title}>
          {title}
        </Heading>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
      <View style={styles.topBarRight}>
        {rightAction}
        <Pressable
          style={styles.outletChip}
          onPress={() => Alert.alert('Segera hadir', 'Fitur ganti outlet belum tersedia.')}
        >
          <StoreIcon size={14} color={tabletColors.gray700} />
          <Text style={styles.outletChipLabel} numberOfLines={1}>
            {storeName}
          </Text>
          <ChevronDownIcon size={14} color={tabletColors.gray700} />
        </Pressable>
        <Pressable
          style={styles.iconButton}
          accessibilityLabel="Notifikasi"
          onPress={onNotificationPress ?? (() => Alert.alert('Notifikasi', 'Belum ada notifikasi baru.'))}
        >
          <BellIcon size={17} color={tabletColors.gray600} />
          {hasNotification ? <View style={styles.dotBadge} /> : null}
        </Pressable>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarLabel}>{userName.charAt(0).toUpperCase()}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    height: tabletLayout.topBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: tabletLayout.topBarPaddingHorizontal,
    backgroundColor: tabletColors.white,
    borderBottomWidth: 1,
    borderBottomColor: tabletColors.gray150,
  },
  title: { fontSize: 18, color: tabletColors.gray900 },
  subtitle: { fontSize: 11.5, color: tabletColors.gray500, marginTop: 1 },
  topBarRight: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  outletChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: tabletColors.gray200,
    backgroundColor: tabletColors.gray50,
  },
  outletChipLabel: { maxWidth: 120, fontSize: 12.5, fontWeight: '600', color: tabletColors.gray700 },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: tabletColors.gray200,
    backgroundColor: tabletColors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: tabletColors.red600,
    borderWidth: 2,
    borderColor: tabletColors.white,
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tabletColors.blue600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLabel: { fontSize: 12, fontWeight: '700', color: tabletColors.white },
});
