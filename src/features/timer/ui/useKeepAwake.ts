// SPDX-License-Identifier: Apache-2.0
import { useEffect } from 'react';
import type { KeepAwake } from '@core/native/keepAwake';

/** Keeps the screen on while `enabled`; releases it when disabled or unmounted. */
export function useKeepAwake(keepAwake: KeepAwake, enabled: boolean): void {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    keepAwake.activate();
    return () => {
      keepAwake.deactivate();
    };
  }, [keepAwake, enabled]);
}
