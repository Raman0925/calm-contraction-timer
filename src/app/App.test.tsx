// SPDX-License-Identifier: Apache-2.0
import { render, screen } from '@testing-library/react-native';
import { App } from './App';

describe('App', () => {
  it('opens on the timer tab', async () => {
    await render(<App />);
    expect(await screen.findByTestId('timer-screen')).toBeOnTheScreen();
    expect(screen.getByText('Ready when you are')).toBeOnTheScreen();
  });
});
