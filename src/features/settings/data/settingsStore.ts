// SPDX-License-Identifier: Apache-2.0
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { ThemePreference } from '@core/design';
import { mmkvStateStorage } from '@core/storage/mmkv';
import { DEFAULT_THRESHOLDS, type PatternThresholds } from '@features/timer/domain/thresholds';

/** Persisted user settings. Contraction data never goes here. */
export interface SettingsState {
  themePreference: ThemePreference;
  /** Switch to the night theme 22:00-06:00 while a session is active. */
  autoNight: boolean;
  patternThresholds: PatternThresholds;
  /** Keep the screen on while the timer is visible during a session. */
  keepAwake: boolean;
  /** Show the ongoing notification with Start/Stop during a session. */
  notificationsEnabled: boolean;
  /** Whether the notification permission has been requested once already. */
  notificationPermissionAsked: boolean;
  /** Phone number for the "Call my provider" button, as typed; blank hides the button. */
  providerPhone: string;
  /** Emergency number for its own call button; empty hides the button. */
  emergencyPhone: string;
  /** When the medical disclaimer was accepted (epoch ms); null shows onboarding. */
  disclaimerAcceptedAt: number | null;
  setThemePreference: (preference: ThemePreference) => void;
  setAutoNight: (enabled: boolean) => void;
  setPatternThresholds: (thresholds: PatternThresholds) => void;
  setKeepAwake: (enabled: boolean) => void;
  setNotificationsEnabled: (enabled: boolean) => void;
  markNotificationPermissionAsked: () => void;
  setProviderPhone: (phone: string) => void;
  setEmergencyPhone: (phone: string) => void;
  acceptDisclaimer: (at: number) => void;
}

/** Settings view-model store, persisted to MMKV. New fields fall back to their defaults. */
export const useSettingsStore = create<SettingsState>()(
  persist(
    set => ({
      themePreference: 'system',
      autoNight: true,
      patternThresholds: DEFAULT_THRESHOLDS,
      keepAwake: true,
      notificationsEnabled: true,
      notificationPermissionAsked: false,
      providerPhone: '',
      emergencyPhone: '',
      disclaimerAcceptedAt: null,
      setThemePreference: themePreference => {
        set({ themePreference });
      },
      setAutoNight: autoNight => {
        set({ autoNight });
      },
      setPatternThresholds: patternThresholds => {
        set({ patternThresholds });
      },
      setKeepAwake: keepAwake => {
        set({ keepAwake });
      },
      setNotificationsEnabled: notificationsEnabled => {
        set({ notificationsEnabled });
      },
      markNotificationPermissionAsked: () => {
        set({ notificationPermissionAsked: true });
      },
      setProviderPhone: providerPhone => {
        set({ providerPhone });
      },
      setEmergencyPhone: emergencyPhone => {
        set({ emergencyPhone });
      },
      acceptDisclaimer: disclaimerAcceptedAt => {
        set({ disclaimerAcceptedAt });
      },
    }),
    {
      name: 'settings',
      version: 1,
      storage: createJSONStorage(() => mmkvStateStorage),
    },
  ),
);
