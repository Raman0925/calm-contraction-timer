// SPDX-License-Identifier: Apache-2.0
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { mmkvStateStorage } from '@core/storage/mmkv';
import type { ThemePreference } from '@core/design';

/** Persisted user settings. */
export interface SettingsState {
  themePreference: ThemePreference;
  /** Switch to the night theme 22:00-06:00 while a session is active. */
  autoNight: boolean;
  setThemePreference: (preference: ThemePreference) => void;
  setAutoNight: (enabled: boolean) => void;
}

/** Settings view-model store, persisted to MMKV. */
export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      themePreference: 'system',
      autoNight: true,
      setThemePreference: themePreference => {
        set({ themePreference });
      },
      setAutoNight: autoNight => {
        set({ autoNight });
      },
    }),
    {
      name: 'settings',
      version: 1,
      storage: createJSONStorage(() => mmkvStateStorage),
    },
  ),
);
