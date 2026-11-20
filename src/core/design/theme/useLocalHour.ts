// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';
import type { Clock } from '@core/utils/clock';

const CHECK_INTERVAL_MS = 60_000;

const hourOf = (clock: Clock): number => new Date(clock.now()).getHours();

/** Local hour of day (0-23), re-checked every minute so night mode can switch on time. */
export function useLocalHour(clock: Clock): number {
  const [hour, setHour] = useState(() => hourOf(clock));

  useEffect(() => {
    const id = setInterval(() => {
      setHour(hourOf(clock));
    }, CHECK_INTERVAL_MS);
    return () => {
      clearInterval(id);
    };
  }, [clock]);

  return hour;
}
