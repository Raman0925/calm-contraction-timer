// SPDX-License-Identifier: Apache-2.0
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';
import { radius, spacing, timerDigits } from '../tokens';
import { AppText } from './AppText';

interface StatTileProps {
  label: string;
  value: string;
  testID?: string;
}

/** A single figure with its caption, read out as one item. Tiles wrap at large font sizes. */
export function StatTile({ label, value, testID }: StatTileProps) {
  const theme = useAppTheme();
  const colour = { color: theme.colors.onSurfaceVariant };
  return (
    <View
      style={[styles.tile, { backgroundColor: theme.colors.surfaceVariant }]}
      accessible
      accessibilityLabel={`${label}: ${value}`}
      testID={testID}
    >
      <AppText variant="titleLarge" style={[timerDigits, colour]}>
        {value}
      </AppText>
      <AppText variant="labelMedium" style={colour}>
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flexGrow: 1,
    flexBasis: 96,
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
});
