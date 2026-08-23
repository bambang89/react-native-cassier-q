import { Fragment } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import type { ReactNode } from 'react';

import { radii } from '@/theme';
import { tabletColors, tabletLayout } from '@/theme/tabletColors';
import { Pressable } from '@/components/ui/forms/Pressable';
import { SearchIcon } from '@/components/icons/LineIcons';
import { Text } from '@/components/ui/typography';

export interface TabletSplitViewProps {
  listWidth?: number;
  children: ReactNode;
  detail: ReactNode;
  searchValue?: string;
  onSearchChange?: (text: string) => void;
  searchPlaceholder?: string;
}

export function TabletSplitView({
  listWidth = tabletLayout.splitListWidth,
  children,
  detail,
  searchValue,
  onSearchChange,
  searchPlaceholder,
}: TabletSplitViewProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.list, { width: listWidth }]}>
        {onSearchChange ? (
          <View style={styles.searchWrap}>
            <View style={styles.searchInputWrap}>
              <SearchIcon size={15} color={tabletColors.gray400} />
              <TextInput
                style={styles.searchInput}
                value={searchValue}
                onChangeText={onSearchChange}
                placeholder={searchPlaceholder}
                placeholderTextColor={tabletColors.gray400}
              />
            </View>
          </View>
        ) : null}
        <ScrollView showsVerticalScrollIndicator={false}>{children}</ScrollView>
      </View>
      <View style={styles.detail}>{detail}</View>
    </View>
  );
}

export interface SplitItemProps {
  active?: boolean;
  onPress: () => void;
  title: string;
  amount?: string;
  meta?: string;
  children?: ReactNode;
}

export function SplitItem({ active, onPress, title, amount, meta, children }: SplitItemProps) {
  return (
    <Pressable onPress={onPress} style={[styles.item, active && styles.itemActive]}>
      {children ?? (
        <Fragment>
          <View style={styles.itemTop}>
            <Text style={[styles.itemName, active && styles.itemNameActive]} numberOfLines={1}>
              {title}
            </Text>
            {amount ? <Text style={styles.itemAmount}>{amount}</Text> : null}
          </View>
          {meta ? <Text style={styles.itemMeta}>{meta}</Text> : null}
        </Fragment>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'row', minHeight: 0 },
  list: {
    borderRightWidth: 1,
    borderRightColor: tabletColors.gray150,
    backgroundColor: tabletColors.white,
  },
  searchWrap: {
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: tabletColors.gray150,
  },
  searchInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: tabletLayout.touchTargetMinHeight,
    paddingHorizontal: 12,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: tabletColors.gray200,
    backgroundColor: tabletColors.white,
  },
  searchInput: { flex: 1, fontSize: 13.5, color: tabletColors.gray900, padding: 0 },
  item: {
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: tabletColors.gray100,
    gap: 4,
  },
  itemActive: {
    backgroundColor: tabletColors.blue50,
    borderLeftWidth: 3,
    borderLeftColor: tabletColors.blue600,
    paddingLeft: 13,
  },
  itemTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  itemName: { flex: 1, fontSize: 13, fontWeight: '700', color: tabletColors.gray900 },
  itemNameActive: { color: tabletColors.blue600 },
  itemAmount: { fontSize: 13, fontWeight: '700', color: tabletColors.gray900 },
  itemMeta: { fontSize: 11.5, color: tabletColors.gray500 },
  detail: { flex: 1, backgroundColor: tabletColors.gray25 },
});
