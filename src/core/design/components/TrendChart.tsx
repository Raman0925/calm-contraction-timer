// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';
import { BarChart, LineChart } from 'react-native-gifted-charts';
import { niceStep } from '../chartScale';
import { useAppTheme } from '../theme/useAppTheme';
import { spacing } from '../tokens';
import { AppText } from './AppText';

interface TrendChartProps {
  /** `bar` for per-item amounts, `line` for change over time. */
  kind: 'bar' | 'line';
  title: string;
  /** Values in order; whole units read best (seconds, minutes). */
  values: number[];
  /**
   * Text under the plot, e.g. the first and last times. Used instead of
   * per-point x-axis labels, which would collide on a phone screen.
   */
  caption: string;
  /** Spoken summary for screen readers; the values are also listed in a table. */
  accessibilityLabel: string;
  testID?: string;
}

const HEIGHT = 160;
const Y_LABEL_WIDTH = 36;
const SECTIONS = 4;

/**
 * A single-series chart on one y-axis with a readable 1/2/5 scale. The title
 * names the series, so there is no legend; it uses the theme's primary colour.
 */
export function TrendChart({
  kind,
  title,
  values,
  caption,
  accessibilityLabel,
  testID,
}: TrendChartProps) {
  const theme = useAppTheme();
  const [width, setWidth] = useState(0);
  const onLayout = (event: LayoutChangeEvent) => {
    setWidth(event.nativeEvent.layout.width);
  };

  const plotWidth = Math.max(0, width - Y_LABEL_WIDTH - spacing.lg);
  const step = values.length > 1 ? plotWidth / values.length : plotWidth;
  const stepValue = niceStep(Math.max(0, ...values), SECTIONS);
  const muted = { color: theme.colors.onSurfaceVariant };
  const common = {
    data: values.map(value => ({ value })),
    height: HEIGHT,
    width: plotWidth,
    noOfSections: SECTIONS,
    stepValue,
    maxValue: stepValue * SECTIONS,
    yAxisLabelWidth: Y_LABEL_WIDTH,
    yAxisTextStyle: { ...muted, fontSize: 11 },
    xAxisLabelsHeight: 0,
    yAxisColor: theme.colors.outlineVariant,
    xAxisColor: theme.colors.outlineVariant,
    rulesColor: theme.colors.outlineVariant,
    rulesType: 'solid',
    yAxisThickness: 0,
    initialSpacing: step / 4,
    endSpacing: step / 4,
    disableScroll: true,
    isAnimated: false,
    // No entry animation (calmer, and respects reduce motion); its timers then fire at once.
    animationDuration: 0,
  } as const;

  return (
    <View
      style={styles.root}
      onLayout={onLayout}
      accessible
      accessibilityRole="image"
      accessibilityLabel={`${title}. ${accessibilityLabel}`}
      testID={testID}
    >
      <AppText variant="titleSmall">{title}</AppText>
      {width > 0 && values.length > 0 ? (
        kind === 'bar' ? (
          <BarChart
            {...common}
            barWidth={Math.max(4, Math.min(24, step / 2))}
            spacing={step / 2}
            frontColor={theme.colors.primary}
            barBorderTopLeftRadius={4}
            barBorderTopRightRadius={4}
          />
        ) : (
          <LineChart
            {...common}
            spacing={step}
            color={theme.colors.primary}
            thickness={2}
            dataPointsColor={theme.colors.primary}
            dataPointsRadius={4}
          />
        )
      ) : null}
      <AppText variant="bodySmall" style={muted}>
        {caption}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: spacing.sm },
});
