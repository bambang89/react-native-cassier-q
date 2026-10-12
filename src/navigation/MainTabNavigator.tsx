import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import PhoneTabBar from './PhoneTabBar';
import SidebarTabBar from './SidebarTabBar';
import { tabTransition } from './transitions';
import { TAB_SCREENS } from './types';
import type { MainTabParamList } from './types';
import MenuScreen from '@/screens/menu/MenuScreen';
import { useResponsive } from '@/hooks/useResponsive';
import { colors } from '@/theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

/**
 * Dua kerangka navigasi:
 * - Tablet (landscape): sidebar ikon di kiri berisi semua layar.
 * - HP (portrait): bottom tab bar 5 item + layar Menu untuk sisanya.
 * Pindah tab dianimasikan dengan transisi "terangkat" yang sama (lihat transitions.ts).
 */
export default function MainTabNavigator() {
  const { isPhone } = useResponsive();

  return (
    <Tab.Navigator
      // Tombol back Android kembali ke tab sebelumnya (mis. Pelanggan → Menu), bukan selalu ke Beranda.
      backBehavior="history"
      tabBar={(props) => (isPhone ? <PhoneTabBar {...props} /> : <SidebarTabBar {...props} />)}
      screenOptions={{
        headerShown: false,
        tabBarPosition: isPhone ? 'bottom' : 'left',
        ...tabTransition,
        sceneStyle: { backgroundColor: colors.canvas },
      }}
    >
      {TAB_SCREENS.map(({ name, title, component }) => (
        <Tab.Screen key={name} name={name} component={component} options={{ title }} />
      ))}
      {isPhone ? <Tab.Screen name="Menu" component={MenuScreen} options={{ title: 'Menu' }} /> : null}
    </Tab.Navigator>
  );
}
