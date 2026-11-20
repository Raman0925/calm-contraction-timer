// SPDX-License-Identifier: Apache-2.0
import { useMemo } from 'react';
import { groupIntoSessions } from '@features/timer/domain/sessions';
import { useContractions } from '@features/timer/ui/useContractions';
import { useTimerServices } from '@features/timer/ui/TimerServices';
import { summariseSession, type SessionSummary } from '../domain/sessionSummary';

/** All sessions, newest first; null until the first load finishes. */
export function useSessions(): SessionSummary[] | null {
  const { repository } = useTimerServices();
  const contractions = useContractions(repository);
  return useMemo(
    () => (contractions ? groupIntoSessions(contractions).map(summariseSession).reverse() : null),
    [contractions],
  );
}
