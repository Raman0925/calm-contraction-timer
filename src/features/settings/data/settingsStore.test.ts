// SPDX-License-Identifier: Apache-2.0
import { PATTERN_PRESETS } from '@features/timer/domain/thresholds';
import { useSettingsStore } from './settingsStore';

describe('settingsStore', () => {
  const store = () => useSettingsStore.getState();

  it('stores thresholds, timer options and the provider number', () => {
    store().setPatternThresholds(PATTERN_PRESETS['4-1-1']);
    store().setKeepAwake(false);
    store().setNotificationsEnabled(false);
    store().markNotificationPermissionAsked();
    store().setProviderPhone('  +44 1234 567890 ');

    expect(store()).toMatchObject({
      patternThresholds: PATTERN_PRESETS['4-1-1'],
      keepAwake: false,
      notificationsEnabled: false,
      notificationPermissionAsked: true,
      providerPhone: '+44 1234 567890',
    });
  });
});
