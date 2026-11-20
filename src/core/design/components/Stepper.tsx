// SPDX-License-Identifier: Apache-2.0
import { StyleSheet, View } from 'react-native';
import { Button } from 'react-native-paper';
import { spacing, timerDigits, touchTarget } from '../tokens';
import { AppText } from './AppText';

/** One adjustment button, e.g. "-1 min". */
export interface StepperStep {
  label: string;
  /** Spoken label, e.g. "Earlier by 1 minute". */
  accessibilityLabel: string;
  onPress: () => void;
}

interface StepperProps {
  label: string;
  value: string;
  steps: StepperStep[];
  disabled?: boolean;
  testID?: string;
}

/** Shows a value with buttons that nudge it. Buttons wrap at large font sizes. */
export function Stepper({ label, value, steps, disabled = false, testID }: StepperProps) {
  return (
    <View style={styles.root} testID={testID}>
      <View accessible accessibilityLabel={`${label}: ${value}`}>
        <AppText variant="labelLarge">{label}</AppText>
        <AppText variant="headlineSmall" style={timerDigits}>
          {value}
        </AppText>
      </View>
      <View style={styles.buttons}>
        {steps.map(step => (
          <Button
            key={step.label}
            mode="outlined"
            compact
            disabled={disabled}
            onPress={step.onPress}
            accessibilityLabel={step.accessibilityLabel}
            contentStyle={styles.button}
          >
            {step.label}
          </Button>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
  buttons: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  button: { minHeight: touchTarget.min, minWidth: touchTarget.min },
});
