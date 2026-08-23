import { Alert, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useAppSelector } from '@/store/hooks';
import { radii, spacing } from '@/theme';
import { tabletColors, tabletLayout } from '@/theme/tabletColors';
import { Pressable } from '@/components/ui/forms';
import { HelpIcon } from '@/components/icons/LineIcons';
import { Text } from '@/components/ui/typography';
import { TAB_ICONS } from './tabIcons';
import type { MainTabParamList } from './types';

const RAIL_WIDTH = tabletLayout.sidebarWidth;
const ICON_COLOR_INACTIVE = '#8FA3BE';

export default function SidebarTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const user = useAppSelector((reduxState) => reduxState.auth.user);

  return (
    <SafeAreaView edges={['top', 'left']} style={[styles.safeArea, { width: RAIL_WIDTH }]}>
      <View style={styles.container}>
        <Image
          source={require('@/assets/branding/cassier-q-symbol.png')}
          style={styles.logo}
          resizeMode="contain"
        />

        <ScrollView
          style={styles.menuList}
          contentContainerStyle={styles.menuListContent}
          showsVerticalScrollIndicator={false}
        >
          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key];
            const label = (options.title ?? route.name) as string;
            const isFocused = state.index === index;
            const Icon = TAB_ICONS[route.name as keyof MainTabParamList];

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <Pressable
                key={route.key}
                onPress={onPress}
                style={[styles.menuItem, isFocused && styles.menuItemActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: isFocused }}
              >
                <Icon size={20} color={isFocused ? tabletColors.white : ICON_COLOR_INACTIVE} strokeWidth={1.7} />
                <Text
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                  style={[styles.menuLabel, isFocused && styles.menuLabelActive]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.bottomSection}>
          <View style={styles.divider} />
          <Pressable
            style={styles.bottomIcon}
            onPress={() => Alert.alert('Bantuan', 'Hubungi admin toko atau dukungan cassier-Q untuk bantuan.')}
            accessibilityLabel="Bantuan"
          >
            <HelpIcon size={19} color={ICON_COLOR_INACTIVE} />
          </Pressable>
          <Pressable
            style={styles.avatar}
            onPress={() => navigation.navigate('Profile')}
            accessibilityLabel="Profil"
          >
            <Text weight="bold" color="inverse" size="sm">
              {(user?.name ?? 'AN').charAt(0).toUpperCase()}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    // No background here: the status-bar inset must stay transparent so the
    // navy rail below doesn't bleed up behind the status bar / notch.
    backgroundColor: 'transparent',
  },
  container: {
    flex: 1,
    backgroundColor: tabletColors.navy900,
    alignItems: 'center',
    paddingVertical: spacing.base,
  },
  logo: {
    width: 36,
    height: 36,
    marginBottom: spacing.lg,
  },
  menuList: { flex: 1, width: '100%' },
  menuListContent: { alignItems: 'center', paddingHorizontal: spacing.xs, gap: spacing.xs },
  menuItem: {
    width: 54,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: radii.xl,
  },
  menuItemActive: { backgroundColor: tabletColors.blue600 },
  menuLabel: { fontSize: 8.5, fontWeight: '600', color: ICON_COLOR_INACTIVE, textAlign: 'center' },
  menuLabelActive: { color: tabletColors.white, fontWeight: '700' },
  bottomSection: { width: '100%', alignItems: 'center' },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: 'rgba(255,255,255,0.15)', width: '80%', marginBottom: spacing.sm },
  bottomIcon: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: tabletColors.blue600,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
});
