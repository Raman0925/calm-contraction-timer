// SPDX-License-Identifier: Apache-2.0
import { Pressable, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';
import { radius, spacing, touchTarget } from '../tokens';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface BigToggleButtonProps {
  /** True while a contraction is being timed. */
  active: boolean;
  startLabel: string;
  stopLabel: string;
  startHint: string;
  stopHint: string;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
}

/**
 * The giant Start/Stop button. State is shown by text, icon and colour
 * together, and the button is at least 120 dp tall.
 */
export function BigToggleButton({
  active,
  startLabel,
  stopLabel,
  startHint,
  stopHint,
  onPress,
  disabled = false,
  testID,
}: BigToggleButtonProps) {
  const theme = useAppTheme();
  const background = active ? theme.colors.tertiary : theme.colors.primary;
  const foreground = active ? theme.colors.onTertiary : theme.colors.onPrimary;
  const label = active ? stopLabel : startLabel;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={active ? stopHint : startHint}
      accessibilityState={{ disabled }}
      android_ripple={{ color: foreground }}
      style={[styles.button, { backgroundColor: background }, disabled && styles.disabled]}
      testID={testID}
    >
      <View style={styles.content}>
        <Icon name={active ? 'stop' : 'play'} size={40} color={foreground} />
        <AppText variant="displaySmall" style={{ color: foreground }}>
          {label}
        </AppText>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: touchTarget.mainButton,
    borderRadius: radius.lg,
    justifyContent: 'center',
    overflow: 'hidden',
    paddingVertical: spacing.lg,
  },
  content: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  disabled: { opacity: 0.6 },
});
