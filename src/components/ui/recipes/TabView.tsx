import { useRef } from 'react';
import { ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import type { NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import type { ReactNode } from 'react';

import { colors, spacing } from '../../../theme';
import { Pressable } from '../forms/Pressable';
import { Text } from '../typography/Text';

export interface TabViewRoute {
  key: string;
  title: string;
  content: ReactNode;
}

export interface TabViewProps {
  routes: TabViewRoute[];
  index: number;
  onIndexChange: (index: number) => void;
}

// Tab view swipeable tanpa dependency `react-native-tab-view`: header tab
// + ScrollView horizontal dengan paging, disinkronkan lewat state `index`.
// Cocok untuk mis. tab "Detail / Riwayat" di layar Reports atau Orders.
export function TabView({ routes, index, onIndexChange }: TabViewProps) {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);

  const goToIndex = (next: number) => {
    onIndexChange(next);
    scrollRef.current?.scrollTo({ x: next * width, animated: true });
  };

  const onMomentumScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = Math.round(e.nativeEvent.contentOffset.x / width);
    if (next !== index) onIndexChange(next);
  };

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        {routes.map((route, i) => {
          const active = i === index;
          return (
            <Pressable key={route.key} style={styles.tab} onPress={() => goToIndex(i)}>
              <Text weight={active ? 'semibold' : 'regular'} color={active ? 'primary' : 'secondary'}>
                {route.title}
              </Text>
              <View style={[styles.indicator, active && styles.indicatorActive]} />
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={onMomentumScrollEnd}
        contentOffset={{ x: index * width, y: 0 }}
      >
        {routes.map((route) => (
          <View key={route.key} style={{ width }}>
            {route.content}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tab: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.xs },
  indicator: { height: 2, width: '60%', borderRadius: 1, backgroundColor: 'transparent' },
  indicatorActive: { backgroundColor: colors.primary[600] },
});
