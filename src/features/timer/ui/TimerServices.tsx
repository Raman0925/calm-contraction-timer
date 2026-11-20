// SPDX-License-Identifier: Apache-2.0
import { createContext, useContext, type ReactNode } from 'react';
import type { Haptics } from '@core/native/haptics';
import type { KeepAwake } from '@core/native/keepAwake';
import type { Clock } from '@core/utils/clock';
import type { ContractionRepository } from '../data/contractionRepository';
import type { SessionNotifier } from '../data/sessionNotifier';

/** Everything the timer needs from the outside world. Tests pass fakes. */
export interface TimerServices {
  repository: ContractionRepository;
  notifier: SessionNotifier;
  haptics: Haptics;
  keepAwake: KeepAwake;
  clock: Clock;
}

const TimerServicesContext = createContext<TimerServices | null>(null);

/** Provides {@link TimerServices} to the screens below it. */
export function TimerServicesProvider({
  services,
  children,
}: {
  services: TimerServices;
  children: ReactNode;
}) {
  return <TimerServicesContext.Provider value={services}>{children}</TimerServicesContext.Provider>;
}

/** Reads the timer services. Throws if used outside {@link TimerServicesProvider}. */
export function useTimerServices(): TimerServices {
  const services = useContext(TimerServicesContext);
  if (!services) {
    throw new Error('useTimerServices must be used inside TimerServicesProvider');
  }
  return services;
}
