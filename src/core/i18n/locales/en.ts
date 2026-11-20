// SPDX-License-Identifier: Apache-2.0
/** English strings. The source of truth for keys; other locales must match this shape. */
export const en = {
  app: {
    name: 'Calm Contraction Timer',
  },
  tabs: {
    timer: 'Timer',
    history: 'History',
    settings: 'Settings',
  },
  timer: {
    emptyTitle: 'Ready when you are',
    emptyMessage: 'Your contractions will appear here.',
  },
  history: {
    emptyTitle: 'No sessions yet',
    emptyMessage: 'Timed contractions are grouped into sessions here.',
  },
  settings: {
    appearance: 'Appearance',
    theme: {
      system: 'Follow system',
      light: 'Light',
      dark: 'Dark',
      night: 'Night (true black, dim)',
    },
    autoNight: 'Automatic night mode',
    autoNightDescription: 'Use the night theme from 22:00 to 06:00 while a session is active.',
  },
  errors: {
    screenTitle: 'Something went wrong',
    screenMessage: 'This screen hit a problem. Your saved contractions are safe.',
    retry: 'Try again',
  },
} as const;

/** Shape every translation must follow. */
export type TranslationShape = typeof en;
