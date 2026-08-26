import { Fragment } from 'react';
import { StatusBar, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SidebarTabBar from './SidebarTabBar';
import { TabIcon } from './tabIcons';
import { PHONE_CORE_TABS, TAB_SCREENS } from './types';
import type { MainTabParamList } from './types';
import { useResponsive } from '@/hooks/useResponsive';
import { colors, fontFamilies, radii, spacing } from '@/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabNavigator() {
  const { isTabletLandscape } = useResponsive();

  return (
    <Tab.Navigator
      tabBar={isTabletLandscape ? (props) => <SidebarTabBar {...props} /> : undefined}
      screenOptions={{
        headerShown: false,
        tabBarPosition: isTabletLandscape ? 'left' : 'bottom',
        tabBarActiveTintColor: colors.primary[600],
        tabBarInactiveTintColor: colors.text.muted,
        tabBarLabelStyle: { fontFamily: fontFamilies.semibold, fontSize: 12 },
        tabBarStyle: isTabletLandscape
          ? styles.sidebar
          : { borderTopColor: colors.border, height: 64, paddingTop: 6, paddingBottom: 8 },
        tabBarItemStyle: isTabletLandscape ? styles.sidebarItem : undefined,
        tabBarLabelPosition: isTabletLandscape ? 'beside-icon' : 'below-icon',
      }}
    >
      {TAB_SCREENS.map(({ name, title, component }) => (
        <Tab.Screen
          key={name}
          name={name}
          component={component}
          options={{
            title,
            tabBarIcon: ({ focused }) => <TabIcon name={name} focused={focused} />,
            tabBarButton: !isTabletLandscape && !PHONE_CORE_TABS.has(name) ? () => null : undefined,
          }}
        />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 220,
    borderTopWidth: 0,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: colors.border,
    backgroundColor: colors.background,
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.sm,
  },
  sidebarItem: {
    flexDirection: 'row',
    borderRadius: radii.md,
    marginBottom: spacing.xs,
    paddingVertical: spacing.sm,
  },
});
