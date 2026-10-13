import { Alert, Image, StyleSheet, View } from 'react-native';
import type { ReactNode } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';

import { useAppSelector } from '@/store/hooks';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, radii, spacing } from '@/theme';
import { isPhoneTabBarRoute } from '@/navigation/phoneTabs';
import { BellIcon, ChevronLeftIcon } from '@/components/icons/LineIcons';
import { PressableScale } from '@/components/ui/motion/PressableScale';
import { FadeInView } from '@/components/ui/motion/FadeInView';
import { Heading } from '@/components/ui/typography/Heading';
import { Text } from '@/components/ui/typography/Text';

export interface HeaderProps {
  title: string;
  subtitle?: string;
  rightElement?: ReactNode;
  /**
   * Lonceng notifikasi + avatar user di kanan. Default: tampil di layar utama,
   * disembunyikan di layar yang punya tombol kembali supaya judul tidak sesak.
   */
  showAccount?: boolean;
}

/**
 * Top bar layar utama di HP (mockup mobile-*.html). Layar yang tidak ada di
 * bottom tab bar (dibuka dari Menu, mis. Pelanggan) otomatis dapat tombol
 * kembali ke Menu.
 */
export function Header({ title, subtitle, rightElement, showAccount }: HeaderProps) {
  const navigation = useNavigation();
  const route = useRoute();
  const user = useAppSelector((state) => state.auth.user);
  const { isPhone } = useResponsive();
  // Tablet tidak punya layar Menu — semua layar ada di sidebar.
  const showBack = isPhone && !isPhoneTabBarRoute(route.name) && navigation.getState()?.type === 'tab';
  const withAccount = showAccount ?? !showBack;
  const initials = (user?.name ?? '?')
    .split(' ')
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');

  return (
    <View style={styles.container}>
      {showBack ? (
        <PressableScale
          activeScale={0.9}
          style={styles.backButton}
          onPress={() => navigation.navigate('Main', { screen: 'Menu' })}
          accessibilityRole="button"
          accessibilityLabel="Kembali ke menu"
          hitSlop={8}
        >
          <ChevronLeftIcon size={20} color={colors.gray[700]} />
        </PressableScale>
      ) : null}
      <FadeInView offsetY={0} offsetX={-8} duration={320} style={styles.textGroup}>
        <Heading level="h3" numberOfLines={1} style={styles.title}>
          {title}
        </Heading>
        {subtitle ? (
          <Text size="xs" color="muted" numberOfLines={1} style={styles.subtitle}>
            {subtitle}
          </Text>
        ) : null}
      </FadeInView>
      <View style={styles.right}>
        {rightElement}
        {withAccount ? (
          <>
            <PressableScale
              activeScale={0.9}
              style={styles.iconButton}
              onPress={() => Alert.alert('Notifikasi', 'Belum ada notifikasi baru.')}
              accessibilityLabel="Notifikasi"
            >
              <BellIcon size={17} color={colors.gray[600]} />
            </PressableScale>
            <PressableScale
              activeScale={0.9}
              style={styles.avatar}
              onPress={() => navigation.navigate('Main', { screen: 'Menu' })}
              accessibilityLabel="Menu akun"
            >
              {user?.avatarUrl ? (
                <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text size="xs" weight="bold" style={styles.avatarLabel}>
                  {initials}
                </Text>
              )}
            </PressableScale>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.gray[50],
    borderWidth: 1,
    borderColor: colors.border,
  },
  textGroup: { flex: 1 },
  title: { fontSize: 20, lineHeight: 26, color: colors.text.primary },
  subtitle: { marginTop: 1 },
  right: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.gray[200],
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[600],
    overflow: 'hidden',
  },
  avatarLabel: { color: colors.white },
  avatarImage: { width: '100%', height: '100%' },
});
