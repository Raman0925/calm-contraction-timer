// SPDX-License-Identifier: Apache-2.0
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { touchTarget } from '../tokens';
import type { IconName } from './Icon';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  mode?: 'contained' | 'contained-tonal' | 'outlined' | 'text';
  icon?: IconName;
  disabled?: boolean;
  /** Read by screen readers when the visible label is not enough. */
  accessibilityHint?: string;
  testID?: string;
}

/** Standard button with a guaranteed 48 dp touch target. */
export function AppButton({
  label,
  onPress,
  mode = 'contained',
  icon,
  disabled = false,
  accessibilityHint,
  testID,
}: AppButtonProps) {
  return (
    <Button
      mode={mode}
      icon={icon}
      onPress={onPress}
      disabled={disabled}
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      testID={testID}
      contentStyle={styles.content}
    >
      {label}
    </Button>
  );
}

const styles = StyleSheet.create({
  content: { minHeight: touchTarget.min },
});
