// SPDX-License-Identifier: Apache-2.0
import { Pressable, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';
import { radius, spacing, touchTarget } from '../tokens';
import { AppText } from './AppText';
import { Icon } from './Icon';

/** One chip in a {@link ChipChoice}. */
export interface ChipOption<T> {
  value: T;
  label: string;
}

interface ChipChoiceProps<T> {
  label: string;
  options: readonly ChipOption<T>[];
  selected: T;
  onChange: (value: T) => void;
  testID?: string;
}

/**
 * Single choice from a few short options, shown as wrapping chips. Each chip is
 * a radio with its checked state, and the whole 48 dp chip is the touch target.
 */
export function ChipChoice<T>({ label, options, selected, onChange, testID }: ChipChoiceProps<T>) {
  const theme = useAppTheme();
  return (
    <View style={styles.root} testID={testID}>
      <AppText variant="labelLarge">{label}</AppText>
      <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel={label}>
        {options.map(option => {
          const checked = option.value === selected;
          const foreground = checked ? theme.colors.onSecondaryContainer : theme.colors.onSurface;
          return (
            <Pressable
              key={option.label}
              onPress={() => {
                onChange(option.value);
              }}
              accessibilityRole="radio"
              accessibilityLabel={option.label}
              accessibilityState={{ checked }}
              android_ripple={{ color: theme.colors.outlineVariant }}
              style={[
                styles.chip,
                {
                  borderColor: checked ? theme.colors.secondaryContainer : theme.colors.outline,
                  backgroundColor: checked
                    ? theme.colors.secondaryContainer
                    : theme.colors.elevation.level0,
                },
              ]}
            >
              {checked ? <Icon name="check" size={18} color={foreground} /> : null}
              <AppText variant="labelLarge" style={{ color: foreground }}>
                {option.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    minHeight: touchTarget.min,
    paddingHorizontal: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
