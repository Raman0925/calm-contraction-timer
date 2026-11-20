// SPDX-License-Identifier: Apache-2.0
import { StyleSheet, View } from 'react-native';
import { formatClock } from '@core/utils/format';
import { useAppTheme } from '../theme/useAppTheme';
import { timerDigits } from '../tokens';
import { AppText } from './AppText';

interface LiveTimerTextProps {
  /** Elapsed time to show, in ms. Null shows 00:00. */
  valueMs: number | null;
  label: string;
  testID?: string;
}

/** Big ticking time with a caption. Tabular digits keep it from jittering. */
export function LiveTimerText({ valueMs, label, testID }: LiveTimerTextProps) {
  const theme = useAppTheme();
  const value = formatClock(valueMs ?? 0);
  return (
    <View
      style={styles.root}
      accessible
      accessibilityRole="timer"
      accessibilityLabel={`${label}: ${value}`}
      testID={testID}
    >
      <AppText variant="displayLarge" style={[timerDigits, styles.center]}>
        {value}
      </AppText>
      <AppText
        variant="titleMedium"
        style={[styles.center, { color: theme.colors.onSurfaceVariant }]}
      >
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center' },
  center: { textAlign: 'center' },
});
