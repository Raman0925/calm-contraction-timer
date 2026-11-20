// SPDX-License-Identifier: Apache-2.0
import { useTranslation } from 'react-i18next';
import { AppText, TextField } from '@core/design';
import { useSettingsStore } from '../data/settingsStore';

const MAX_PHONE_LENGTH = 32;

/** Numbers behind the call buttons on the timer screen. */
export function ContactsSection() {
  const { t } = useTranslation();
  const providerPhone = useSettingsStore(state => state.providerPhone);
  const emergencyPhone = useSettingsStore(state => state.emergencyPhone);
  const setProviderPhone = useSettingsStore(state => state.setProviderPhone);
  const setEmergencyPhone = useSettingsStore(state => state.setEmergencyPhone);

  return (
    <>
      <AppText variant="titleSmall" accessibilityRole="header">
        {t('settings.contactsSection')}
      </AppText>
      <TextField
        label={t('settings.providerPhone')}
        value={providerPhone}
        onChangeText={setProviderPhone}
        keyboardType="phone-pad"
        maxLength={MAX_PHONE_LENGTH}
        testID="provider-phone"
      />
      <TextField
        label={t('settings.emergencyPhone')}
        value={emergencyPhone}
        onChangeText={setEmergencyPhone}
        keyboardType="phone-pad"
        maxLength={MAX_PHONE_LENGTH}
        testID="emergency-phone"
      />
    </>
  );
}
