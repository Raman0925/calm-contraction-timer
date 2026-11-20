// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render, screen } from '@testing-library/react-native';
import { AppThemeProvider } from '@core/design';
import { useSettingsStore } from '../data/settingsStore';
import { SettingsScreen } from './SettingsScreen';

function renderSettings() {
  return render(
    <AppThemeProvider preference="system" autoNight sessionActive={false}>
      <SettingsScreen />
    </AppThemeProvider>,
  );
}

describe('SettingsScreen', () => {
  beforeEach(() => {
    useSettingsStore.setState({ themePreference: 'system', autoNight: true });
  });

  it('stores the chosen theme', async () => {
    await renderSettings();
    await fireEvent.press(screen.getByText('Night (true black, dim)'));
    expect(useSettingsStore.getState().themePreference).toBe('night');
  });

  it('toggles automatic night mode from the whole row', async () => {
    await renderSettings();
    const row = screen.getByRole('switch', { name: 'Automatic night mode' });
    expect(row).toBeChecked();
    await fireEvent.press(row);
    expect(useSettingsStore.getState().autoNight).toBe(false);
  });
});
