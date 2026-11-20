// SPDX-License-Identifier: Apache-2.0
import { useTranslation } from 'react-i18next';
import { AppText, SwitchRow } from '@core/design';
import { useTimerServices } from '@features/timer/ui/TimerServices';
import { useSettingsStore } from '../data/settingsStore';

/** Keep screen on and the lock-screen notification. */
export function TimerSection() {
  const { t } = useTranslation();
  const keepAwake = useSettingsStore(state => state.keepAwake);
  const setKeepAwake = useSettingsStore(state => state.setKeepAwake);
  const notificationsEnabled = useSettingsStore(state => state.notificationsEnabled);
  const setNotificationsEnabled = useSettingsStore(state => state.setNotificationsEnabled);
  const { notifier } = useTimerServices();

  /** Turning the notification on needs permission; if it is blocked, open system settings. */
  const changeNotifications = (enabled: boolean) => {
    if (!enabled) {
      setNotificationsEnabled(false);
      return;
    }
    notifier
      .requestPermission()
      .then(async granted => {
        setNotificationsEnabled(granted);
        if (!granted) {
          await notifier.openSettings();
        }
      })
      .catch((error: unknown) => {
        console.error('Notification permission request failed', error);
      });
  };

  return (
    <>
      <AppText variant="titleSmall" accessibilityRole="header">
        {t('settings.timerSection')}
      </AppText>
      <SwitchRow
        title={t('settings.keepAwake')}
        description={t('settings.keepAwakeDescription')}
        value={keepAwake}
        onValueChange={setKeepAwake}
        testID="keep-awake-switch"
      />
      <SwitchRow
        title={t('settings.notifications')}
        description={t('settings.notificationsDescription')}
        value={notificationsEnabled}
        onValueChange={changeNotifications}
        testID="notifications-switch"
      />
    </>
  );
}
