// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';
import { currentSession } from '../domain/currentSession';
import type { Session } from '../domain/sessions';
import { useContractions } from './useContractions';
import { useNow } from './useNow';
import { useTimerServices } from './TimerServices';

/** The ongoing session (or null), the time it was evaluated at, and whether data has loaded. */
export interface CurrentSessionState {
  loaded: boolean;
  session: Session | null;
  now: number;
}

/** Tracks the ongoing session, re-evaluating every `tickMs` while there is any data. */
export function useCurrentSession(tickMs = 1_000): CurrentSessionState {
  const { repository, clock } = useTimerServices();
  const contractions = useContractions(repository);
  const now = useNow(clock, (contractions?.length ?? 0) > 0, tickMs);
  const session = useMemo(
    () => (contractions ? currentSession(contractions, now) : null),
    [contractions, now],
  );
  return { loaded: contractions !== null, session, now };
}
