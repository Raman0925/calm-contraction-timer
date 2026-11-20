// SPDX-License-Identifier: Apache-2.0
import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSettingsStore } from '@features/settings/data/settingsStore';
import { computeStats, type ContractionStats } from '@features/timer/domain/computeStats';
import type { Contraction } from '@features/timer/domain/contraction';
import { groupIntoSessions, type Session } from '@features/timer/domain/sessions';
import { useContractions } from '@features/timer/ui/useContractions';
import { useTimerServices } from '@features/timer/ui/TimerServices';
import { useUndoOffer, type UndoOfferState } from '@features/timer/ui/useUndoOffer';
import type { UpdateError } from '@features/timer/data/contractionRepository';
import { toPatch, undoPatch, type ContractionDraft } from '../domain/contractionDraft';

/** View state for the session detail screen. */
export interface SessionDetailState extends Omit<UndoOfferState, 'offer'> {
  loaded: boolean;
  /** Null when the session no longer exists, e.g. all its contractions were deleted. */
  session: Session | null;
  stats: ContractionStats;
  /** When the data was last loaded; edits cannot move times past it. */
  now: number;
  /** Saves an edit with Undo. Resolves the error, or null when saved. */
  save: (original: Contraction, draft: ContractionDraft) => Promise<UpdateError | null>;
  /** Deletes a contraction with Undo. */
  remove: (contraction: Contraction) => Promise<void>;
}

/**
 * View-model for one session. The session is followed through an anchor
 * contraction, re-anchored before a delete, so editing never loses the screen.
 */
export function useSessionDetail(sessionKey: number): SessionDetailState {
  const { t } = useTranslation();
  const { repository, clock } = useTimerServices();
  const thresholds = useSettingsStore(state => state.patternThresholds);
  const contractions = useContractions(repository);
  const [anchorId, setAnchorId] = useState(sessionKey);
  const { offer, ...undoState } = useUndoOffer();

  const session = useMemo(
    () =>
      groupIntoSessions(contractions ?? []).find(s =>
        s.contractions.some(c => c.id === anchorId),
      ) ?? null,
    [contractions, anchorId],
  );
  // Taken when the data changes; nothing here ticks, so the screen does not re-render every second.
  const now = useMemo(() => (contractions ? clock.now() : 0), [clock, contractions]);
  const stats = useMemo(
    () => computeStats(session?.contractions ?? [], thresholds, now),
    [session, thresholds, now],
  );

  const save = useCallback(
    async (original: Contraction, draft: ContractionDraft) => {
      const patch = toPatch(draft);
      const result = await repository.update(original.id, patch);
      if (!result.ok) {
        return result.error;
      }
      offer(
        t('edit.saved'),
        async () => (await repository.update(original.id, undoPatch(original, patch))).ok,
      );
      return null;
    },
    [repository, offer, t],
  );

  const remove = useCallback(
    async (contraction: Contraction) => {
      const other = session?.contractions.find(c => c.id !== contraction.id);
      if (contraction.id === anchorId && other) {
        setAnchorId(other.id);
      }
      const removed = await repository.remove(contraction.id);
      if (removed) {
        offer(t('edit.deleted'), async () => (await repository.restore(removed)).ok);
      }
    },
    [repository, session, anchorId, offer, t],
  );

  return { loaded: contractions !== null, session, stats, now, save, remove, ...undoState };
}
