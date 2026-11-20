// SPDX-License-Identifier: Apache-2.0
import { trigger } from 'react-native-haptic-feedback';

/** Short physical feedback for important taps. */
export interface Haptics {
  /** A firm tap confirming Start or Stop. */
  confirm(): void;
}

/** Haptics backed by react-native-haptic-feedback. Respects the system vibration setting. */
export const deviceHaptics: Haptics = {
  confirm: () => {
    trigger('impactMedium');
  },
};
