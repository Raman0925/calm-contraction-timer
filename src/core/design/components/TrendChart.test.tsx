// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppThemeProvider } from '../theme/AppThemeProvider';
import { TrendChart } from './TrendChart';

async function renderChart(kind: 'bar' | 'line', values: number[]) {
  await render(
    <AppThemeProvider preference="night" autoNight={false} sessionActive={false}>
      <TrendChart
        kind={kind}
        title="Length"
        values={values}
        caption="From 09:00 to 10:00"
        accessibilityLabel="Longest 01:10"
        testID="chart"
      />
    </AppThemeProvider>,
  );
  await fireEvent(screen.getByTestId('chart'), 'layout', {
    nativeEvent: { layout: { width: 360, height: 220 } },
  });
}

describe('TrendChart', () => {
  it.each([
    ['bar', [60, 75, 50]],
    ['line', [5, 4.5, 6]],
    ['bar', [70]],
    ['line', [0, 0]],
  ] as const)('renders a %s chart of %p once laid out', async (kind, values) => {
    await renderChart(kind, [...values]);
    expect(screen.getByTestId('chart')).toHaveAccessibleName('Length. Longest 01:10');
    expect(screen.getByText('From 09:00 to 10:00')).toBeOnTheScreen();
  });

  it('labels the y-axis in readable steps', async () => {
    await renderChart('bar', [60, 75, 50]);
    for (const label of ['20', '40', '60', '80']) {
      expect(screen.getByText(label)).toBeOnTheScreen();
    }
  });
});
