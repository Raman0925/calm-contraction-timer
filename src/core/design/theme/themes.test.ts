// SPDX-License-Identifier: Apache-2.0
import { MD3LightTheme } from 'react-native-paper';
import { getTheme } from './themes';

describe('themes', () => {
  it.each(['light', 'dark', 'night'] as const)('%s theme defines every MD3 colour role', name => {
    const colours = getTheme(name).colors;
    for (const role of Object.keys(MD3LightTheme.colors)) {
      expect(colours).toHaveProperty(role);
    }
  });

  it('night theme uses true black and is dark', () => {
    const night = getTheme('night');
    expect(night.dark).toBe(true);
    expect(night.colors.background).toBe('#000000');
    expect(night.colors.surface).toBe('#000000');
  });
});
