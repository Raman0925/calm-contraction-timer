// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import type { Clock } from '@core/utils/clock';

/**
 * Current time from `clock`, refreshed every `intervalMs` while `enabled` and
 * the app is in the foreground. Refreshes immediately when the app returns.
 */
export function useNow(clock: Clock, enabled: boolean, intervalMs = 1_000): number {
  const [now, setNow] = useState(() => clock.now());

  useEffect(() => {
    if (!enabled) {
      return;
    }
    let timer: ReturnType<typeof setInterval> | undefined;
    const tick = () => {
      setNow(clock.now());
    };
    const startTicking = () => {
      tick();
      timer ??= setInterval(tick, intervalMs);
    };
    const stopTicking = () => {
      clearInterval(timer);
      timer = undefined;
    };

    if (AppState.currentState !== 'background') {
      startTicking();
    }
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') {
        startTicking();
      } else if (state === 'background') {
        stopTicking();
      }
    });
    return () => {
      subscription.remove();
      stopTicking();
    };
  }, [clock, enabled, intervalMs]);

  return now;
}
