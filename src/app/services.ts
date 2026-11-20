// SPDX-License-Identifier: Apache-2.0
import { deviceHaptics } from '@core/native/haptics';
import { nativeKeepAwake } from '@core/native/keepAwake';
import { systemClock } from '@core/utils/clock';
import { notifyKitSessionNotifier } from '@features/timer/data/NotifyKitSessionNotifier';
import { getContractionRepository } from '@features/timer/data/repositoryInstance';
import type { TimerServices } from '@features/timer/ui/TimerServices';

/** Opens the database and wires the real device implementations. */
export async function createProductionServices(): Promise<TimerServices> {
  return {
    repository: await getContractionRepository(),
    notifier: notifyKitSessionNotifier,
    haptics: deviceHaptics,
    keepAwake: nativeKeepAwake,
    clock: systemClock,
  };
}
