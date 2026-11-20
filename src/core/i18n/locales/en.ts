// SPDX-License-Identifier: Apache-2.0
/** English strings. The source of truth for keys; other locales must match this shape. */
export const en = {
  app: {
    name: 'Calm Contraction Timer',
    loading: 'Opening your data…',
    dbErrorTitle: 'Could not open your data',
    dbErrorMessage:
      'Please close and reopen the app. Your saved contractions have not been changed.',
  },
  tabs: {
    timer: 'Timer',
    history: 'History',
    settings: 'Settings',
  },
  timer: {
    start: 'Start',
    stop: 'Stop',
    startHint: 'Starts timing a contraction',
    stopHint: 'Ends the contraction being timed',
    contractionLabel: 'Contraction',
    sinceLastLabel: 'Since the last contraction started',
    readyLabel: 'Tap Start when a contraction begins',
    announceStarted: 'Contraction started',
    announceStopped: 'Contraction stopped. It lasted {{duration}}.',
    started: 'Contraction started',
    stopped: 'Contraction stopped',
    undo: 'Undo',
    undoFailed: 'Could not undo: the contraction was changed in the meantime.',
    lastHour: 'Last hour',
    avgDuration: 'Average length',
    avgInterval: 'Average frequency',
    count: 'Contractions',
    minutesValue: '{{value}} min',
    noValue: '–',
    recent: 'Recent contractions',
    recentDuration: 'Lasted {{duration}}',
    recentInterval: '{{minutes}} min after the previous one',
    callProvider: 'Call my provider',
    callProviderHint: 'Opens the phone app with your saved number',
  },
  pattern: {
    matched: 'Pattern matches your {{label}} setting for {{minutes}} min',
    building: 'Within your {{label}} setting for {{minutes}} min so far',
    none: 'Not currently matching your {{label}} setting',
    footnote: 'For information only. Follow the advice of your midwife or doctor.',
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
    timerSection: 'Timer',
    keepAwake: 'Keep screen on',
    keepAwakeDescription: 'While the timer is open during a session.',
    notifications: 'Timer notification',
    notificationsDescription:
      'Show the running timer with Start and Stop buttons, also on the lock screen, during a session.',
  },
  notification: {
    channelName: 'Contraction timer',
    channelDescription: 'Shows the running timer with Start and Stop buttons during a session.',
    contractingTitle: 'Contraction in progress',
    contractingBody: 'Tap Stop when it ends.',
    restingTitle: 'Resting',
    restingBody: 'Time since the last contraction started.',
    start: 'Start',
    stop: 'Stop',
  },
  errors: {
    screenTitle: 'Something went wrong',
    screenMessage: 'This screen hit a problem. Your saved contractions are safe.',
    retry: 'Try again',
  },
} as const;

/** Shape every translation must follow. */
export type TranslationShape = typeof en;
