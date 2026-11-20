// SPDX-License-Identifier: Apache-2.0
import { useCallback, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo } from 'react-native';
import { formatClock } from '@core/utils/format';
import { useSettingsStore } from '@features/settings/data/settingsStore';
import { syncSessionNotification } from '../data/notificationSync';
import { computeStats, type ContractionStat, type ContractionStats } from '../domain/computeStats';
import { useCurrentSession } from './useCurrentSession';
import { useTimerServices } from './TimerServices';
import { useUndoOffer, type UndoOfferState } from './useUndoOffer';

const RECENT_COUNT = 5;

/** View state for the timer screen. */
export interface TimerViewState extends Omit<UndoOfferState, 'offer'> {
  loaded: boolean;
  /** A session is running (a contraction was recorded within the last 6 h). */
  sessionActive: boolean;
  /** A contraction is being timed right now. */
  contracting: boolean;
  /** Contraction length while contracting, otherwise time since the last start. Null before any. */
  elapsedMs: number | null;
  stats: ContractionStats;
  /** Up to five most recent contractions, newest first. */
  recent: ContractionStat[];
  busy: boolean;
  toggle: () => void;
}

/** View-model for the timer screen: live state, Start/Stop and Undo. */
export function useTimer(): TimerViewState {
  const { t } = useTranslation();
  const services = useTimerServices();
  const { repository, notifier, haptics, clock } = services;
  const thresholds = useSettingsStore(state => state.patternThresholds);
  const { loaded, session, now } = useCurrentSession();
  const { offer, ...undoState } = useUndoOffer();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  const stats = useMemo(
    () => computeStats(session?.contractions ?? [], thresholds, now),
    [session, thresholds, now],
  );
  const latest = stats.items.at(-1);

  /** First session only: ask before the Undo offer, so the dialog never eats its time. */
  const askForNotificationsOnce = useCallback(async () => {
    const settings = useSettingsStore.getState();
    if (!settings.notificationsEnabled || settings.notificationPermissionAsked) {
      return;
    }
    settings.markNotificationPermissionAsked();
    if (await notifier.requestPermission()) {
      // The first sync ran before permission existed, so show the notification now.
      await syncSessionNotification({ ...services, isEnabled: () => true });
    } else {
      settings.setNotificationsEnabled(false);
    }
  }, [notifier, services]);

  const start = useCallback(async () => {
    const result = await repository.start(clock.now());
    if (!result.ok) {
      return;
    }
    const { id } = result.value;
    haptics.confirm();
    AccessibilityInfo.announceForAccessibility(t('timer.announceStarted'));
    await askForNotificationsOnce();
    offer(t('timer.started'), async () => (await repository.remove(id)) !== null);
  }, [repository, clock, haptics, t, askForNotificationsOnce, offer]);

  const stop = useCallback(async () => {
    const result = await repository.stop(clock.now());
    if (!result.ok) {
      return;
    }
    const { id, startedAt, endedAt } = result.value;
    haptics.confirm();
    const duration = formatClock((endedAt ?? startedAt) - startedAt);
    AccessibilityInfo.announceForAccessibility(t('timer.announceStopped', { duration }));
    offer(t('timer.stopped'), async () => (await repository.update(id, { endedAt: null })).ok);
  }, [repository, clock, haptics, t, offer]);

  const toggle = useCallback(() => {
    if (busyRef.current) {
      return;
    }
    busyRef.current = true;
    setBusy(true);
    // The notification may have changed things a moment ago. Act only if the screen
    // matches storage; otherwise the tap was meant for a state that is gone, and the
    // screen refreshes from the repository subscription.
    const shownAsContracting = stats.active !== null;
    repository
      .getActive()
      .then(active => {
        if ((active !== null) !== shownAsContracting) {
          return;
        }
        return active ? stop() : start();
      })
      .catch((error: unknown) => {
        console.error('Start/Stop failed', error);
      })
      .finally(() => {
        busyRef.current = false;
        setBusy(false);
      });
  }, [repository, stats.active, start, stop]);

  return {
    loaded,
    sessionActive: session !== null,
    contracting: stats.active !== null,
    elapsedMs: latest ? now - latest.contraction.startedAt : null,
    stats,
    recent: stats.items.slice(-RECENT_COUNT).reverse(),
    ...undoState,
    busy,
    toggle,
  };
}
