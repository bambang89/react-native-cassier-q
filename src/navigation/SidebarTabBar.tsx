import { useEffect, useRef } from 'react';
import { Alert, Animated, Image, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import { useAppSelector } from '@/store/hooks';
import { motion, radii, spacing } from '@/theme';
import { tabletColors, tabletLayout } from '@/theme/tabletColors';
import { Pressable } from '@/components/ui/forms';
import { PressableScale } from '@/components/ui/motion';
import { HelpIcon } from '@/components/icons/LineIcons';
import { Text } from '@/components/ui/typography';
import { TAB_ICONS } from './tabIcons';
import type { MainTabParamList } from './types';
import { useMenuAccess } from './menuCatalog';

const RAIL_WIDTH = tabletLayout.sidebarWidth;
const ITEM_HEIGHT = 50;
const ITEM_GAP = spacing.xs;
const ICON_COLOR_INACTIVE = '#8FA3BE';

export default function SidebarTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const user = useAppSelector((reduxState) => reduxState.auth.user);
  const { canTab } = useMenuAccess();
  // Hanya menu yang diizinkan Kepala Toko untuk role user ini.
  const routes = state.routes.filter((route) => canTab(route.name as keyof MainTabParamList));
  const focusedKey = state.routes[state.index]?.key;
  const visibleIndex = routes.findIndex((route) => route.key === focusedKey);
  // Sorotan biru bergeser (spring) dari item lama ke item baru, bukan berpindah instan.
  const highlightY = useRef(new Animated.Value(Math.max(visibleIndex, 0) * (ITEM_HEIGHT + ITEM_GAP))).current;

  useEffect(() => {
    if (visibleIndex < 0) return;
    Animated.spring(highlightY, {
      toValue: visibleIndex * (ITEM_HEIGHT + ITEM_GAP),
      useNativeDriver: true,
      ...motion.spring.gentle,
    }).start();
  }, [visibleIndex, highlightY]);

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
          <View style={styles.menuColumn}>
          <Animated.View
            style={[styles.highlight, { opacity: visibleIndex < 0 ? 0 : 1, transform: [{ translateY: highlightY }] }]}
          />
          {routes.map((route) => {
            const { options } = descriptors[route.key];
            const label = (options.title ?? route.name) as string;
            const isFocused = route.key === focusedKey;
            const Icon = TAB_ICONS[route.name as keyof MainTabParamList];

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            };

            return (
              <PressableScale
                key={route.key}
                onPress={onPress}
                activeScale={0.92}
                style={styles.menuItem}
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
              </PressableScale>
            );
          })}
          </View>
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
  menuListContent: { alignItems: 'center', paddingHorizontal: spacing.xs },
  menuColumn: { width: 54, gap: ITEM_GAP },
  highlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 54,
    height: ITEM_HEIGHT,
    borderRadius: radii.xl,
    backgroundColor: tabletColors.blue600,
    shadowColor: tabletColors.blue600,
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  menuItem: {
    width: 54,
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    borderRadius: radii.xl,
  },
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
