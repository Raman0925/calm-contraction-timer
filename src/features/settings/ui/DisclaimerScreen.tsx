// SPDX-License-Identifier: Apache-2.0
import { useTranslation } from 'react-i18next';
import { AppText, Screen } from '@core/design';
import { formatDay } from '@core/utils/dateFormat';
import { useSettingsStore } from '../data/settingsStore';

/** The medical disclaimer, with when it was accepted. */
export function DisclaimerScreen() {
  const { t } = useTranslation();
  const acceptedAt = useSettingsStore(state => state.disclaimerAcceptedAt);
  return (
    <Screen testID="disclaimer-screen">
      <AppText variant="bodyLarge">{t('disclaimer.body')}</AppText>
      {acceptedAt === null ? null : (
        <AppText variant="bodySmall">
          {t('disclaimer.acceptedOn', { day: formatDay(acceptedAt) })}
        </AppText>
      )}
    </Screen>
  );
}
