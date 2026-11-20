// SPDX-License-Identifier: Apache-2.0
import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

/** Small key-value store for settings and flags. Never store health data here. */
export const settingsStorage = createMMKV({ id: 'settings' });

/** Adapter so zustand's `persist` middleware can write to MMKV synchronously. */
export const mmkvStateStorage: StateStorage = {
  getItem: key => settingsStorage.getString(key) ?? null,
  setItem: (key, value) => {
    settingsStorage.set(key, value);
  },
  removeItem: key => {
    settingsStorage.remove(key);
  },
};
