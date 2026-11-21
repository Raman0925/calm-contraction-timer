// SPDX-License-Identifier: Apache-2.0
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';
import { radius, spacing, timerDigits } from '../tokens';
import { AppText } from './AppText';

interface StatTileProps {
  label: string;
  value: string;
  testID?: string;
}

/** Narrowest tile at 100% text size; it grows with the text so captions never break mid-word. */
const MIN_TILE_WIDTH = 96;

/** A single figure with its caption, read out as one item. Tiles wrap at large font sizes. */
export function StatTile({ label, value, testID }: StatTileProps) {
  const theme = useAppTheme();
  const { fontScale } = useWindowDimensions();
  const colour = { color: theme.colors.onSurfaceVariant };
  return (
    <View
      style={[
        styles.tile,
        {
          backgroundColor: theme.colors.surfaceVariant,
          flexBasis: MIN_TILE_WIDTH * Math.max(1, fontScale),
        },
      ]}
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
    padding: spacing.md,
    borderRadius: radius.md,
    gap: spacing.xs,
  },
});
