import { FlatList, StyleSheet, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import type { FlatListProps } from 'react-native';
import type { ReactNode } from 'react';

import { colors, spacing } from '../../../theme';
import { Pressable } from '../forms/Pressable';
import { Text } from '../typography/Text';

export interface SwipeListAction {
  label: string;
  onPress: () => void;
  color?: string;
}

export interface SwipeListProps<T> extends Omit<FlatListProps<T>, 'renderItem'> {
  data: T[];
  renderItem: (item: T, index: number) => ReactNode;
  rightActions?: (item: T, index: number) => SwipeListAction[];
  keyExtractor: FlatListProps<T>['keyExtractor'];
}

// List dengan baris yang bisa di-swipe untuk memunculkan aksi (mis. "Hapus"
// pada item keranjang atau produk). Dibangun di atas Swipeable dari
// react-native-gesture-handler (sudah jadi dependency project).
export function SwipeList<T>({ data, renderItem, rightActions, keyExtractor, ...rest }: SwipeListProps<T>) {
  return (
    <FlatList
      data={data}
      keyExtractor={keyExtractor}
      renderItem={({ item, index }) => {
        const actions = rightActions?.(item, index) ?? [];
        if (actions.length === 0) {
          return <>{renderItem(item, index)}</>;
        }
        return (
          <Swipeable
            renderRightActions={() => (
              <View style={styles.actions}>
                {actions.map((action, actionIndex) => (
                  <Pressable
                    key={actionIndex}
                    onPress={action.onPress}
                    style={[styles.action, { backgroundColor: action.color ?? colors.error[600] }]}
                  >
                    <Text size="sm" weight="semibold" style={styles.actionText}>
                      {action.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            )}
          >
            {renderItem(item, index)}
          </Swipeable>
        );
      }}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: 'row' },
  action: { justifyContent: 'center', alignItems: 'center', paddingHorizontal: spacing.base },
  actionText: { color: colors.white },
});
