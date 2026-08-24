import { Pressable } from '@/components/ui/forms';
import { Text } from '@/components/ui/typography';

import { styles } from '../POSScreen.styles';

export function CategoryChip({
  label,
  active,
  tablet,
  onPress,
}: {
  label: string;
  active: boolean;
  tablet?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        tablet && styles.chipTablet,
        active && (tablet ? styles.chipActiveTablet : styles.chipActive),
      ]}
    >
      <Text
        size="sm"
        weight="semibold"
        color={active ? 'inverse' : 'secondary'}
        style={tablet && !active ? styles.chipLabelTablet : undefined}
      >
        {label}
      </Text>
    </Pressable>
  );
}
