// SPDX-License-Identifier: Apache-2.0
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppButton, AppText, ListRow } from '@core/design';
import { RESTORE_MESSAGES } from '@features/paywall/ui/PaywallScreen';
import { usePro } from '@features/paywall/ui/ProServices';

/** Pro status, a way to unlock it, and Restore purchases. */
export function ProSection() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const pro = usePro();
  const [message, setMessage] = useState<string | null>(null);

  const restore = () => {
    setMessage(null);
    pro
      .restore()
      .then(result => {
        setMessage(t(RESTORE_MESSAGES[result]));
      })
      .catch((error: unknown) => {
        console.error('Restore failed', error);
      });
  };

  return (
    <>
      <AppText variant="titleSmall" accessibilityRole="header">
        {t('pro.badge')}
      </AppText>
      {pro.isPro ? (
        <ListRow icon="check-decagram-outline" title={t('pro.settingsActive')} />
      ) : (
        <ListRow
          icon="lock-open-variant-outline"
          title={t('pro.settingsInactive')}
          description={t('pro.settingsInactiveDescription')}
          onPress={() => {
            navigation.navigate('Paywall');
          }}
          testID="open-paywall"
        />
      )}
      <AppButton
        label={t('pro.restore')}
        accessibilityHint={t('pro.restoreHint')}
        mode="outlined"
        icon="restore"
        onPress={restore}
        testID="settings-restore"
      />
      {message ? (
        <AppText variant="bodyMedium" accessibilityLiveRegion="polite">
          {message}
        </AppText>
      ) : null}
    </>
  );
}
