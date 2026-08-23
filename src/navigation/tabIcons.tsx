import { StyleSheet, View } from 'react-native';
import {
  BarChartIcon,
  BoxIcon,
  CartIcon,
  ClipboardIcon,
  DashboardIcon,
  EmployeeIcon,
  LayersIcon,
  PeopleIcon,
  PlugIcon,
  ReceiptIcon,
  SettingsIcon,
  StoreIcon,
} from '@/components/icons/LineIcons';
import type { LineIconProps } from '@/components/icons/LineIcons';
import type { ComponentType } from 'react';
import type { MainTabParamList } from './types';
import { colors, radii } from '@/theme';

export const TAB_ICONS: Record<keyof MainTabParamList, ComponentType<LineIconProps>> = {
  Dashboard: DashboardIcon,
  POS: CartIcon,
  Orders: ReceiptIcon,
  Pesanan: ClipboardIcon,
  Products: BoxIcon,
  Inventory: LayersIcon,
  Customers: PeopleIcon,
  Reports: BarChartIcon,
  Employees: EmployeeIcon,
  StoreProfile: StoreIcon,
  Integrations: PlugIcon,
  Expenses: ReceiptIcon,
  Profile: SettingsIcon,
};

export function TabIcon({ name, focused }: { name: keyof MainTabParamList; focused: boolean }) {
  const Icon = TAB_ICONS[name];
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Icon size={18} color={focused ? colors.primary[600] : colors.text.muted} />
    </View>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: radii.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: colors.primary[50],
  },
});
