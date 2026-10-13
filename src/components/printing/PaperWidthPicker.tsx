import { StyleSheet, View } from 'react-native';

import { PAPER_CHARS, PAPER_WIDTHS } from '@/services/printing';
import type { PaperWidth } from '@/services/printing';
import { colors, spacing } from '@/theme';
import { Pressable } from '@/components/ui/forms';
import { Text } from '@/components/ui/typography';

/** Segmented picker for the receipt paper width (58mm / 80mm). */
export function PaperWidthPicker({
  value,
  onChange,
  showChars = false,
}: {
  value: PaperWidth;
  onChange: (width: PaperWidth) => void;
  /** Show the characters-per-line hint under each label (used on the settings screen). */
  showChars?: boolean;
}) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {PAPER_WIDTHS.map((width) => {
        const active = value === width;
        return (
          <Pressable
            key={width}
            onPress={() => onChange(width)}
            style={[styles.option, active && styles.optionActive]}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`Kertas ${width} milimeter`}
          >
            <Text size="sm" weight="semibold" color={active ? 'inverse' : 'secondary'}>
              {width}mm
            </Text>
            {showChars ? (
              <Text size="xs" color={active ? 'inverse' : 'muted'}>
                {PAPER_CHARS[width]} karakter/baris
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
    borderRadius: 9999,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  optionActive: { backgroundColor: colors.primary[600], borderColor: colors.primary[600] },
});
