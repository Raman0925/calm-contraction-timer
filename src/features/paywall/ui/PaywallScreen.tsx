// SPDX-License-Identifier: Apache-2.0
import { useNavigation } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { AppButton, AppText, ListRow, Screen, useAppTheme, type IconName } from '@core/design';
import type { BillingErrorKind } from '../domain/entitlement';
import { usePro } from './ProServices';

/** Only what Pro includes today; future Pro features are described as such. */
const BENEFITS: { icon: IconName; key: 'benefitReport' | 'benefitFuture' | 'benefitSupport' }[] = [
  { icon: 'file-pdf-box', key: 'benefitReport' },
  { icon: 'gift-outline', key: 'benefitFuture' },
  { icon: 'heart-outline', key: 'benefitSupport' },
];

export const RESTORE_MESSAGES = {
  owned: 'pro.restored',
  none: 'pro.nothingToRestore',
  error: 'pro.restoreFailed',
} as const;

const ERROR_KEYS = {
  network: 'pro.errorNetwork',
  unavailable: 'pro.errorUnavailable',
  failed: 'pro.errorFailed',
  cancelled: 'pro.errorFailed',
  pending: 'pro.pending',
  'already-owned': 'pro.owned',
} as const satisfies Record<BillingErrorKind, string>;

/**
 * One-time Pro unlock. Plain price, clear benefits, Restore always visible,
 * and "Not now" closes it. No timers, tricks or pre-selected upsells.
 */
export function PaywallScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const navigation = useNavigation();
  const pro = usePro();
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);
  const { refresh } = pro;

  // Google Play may have been unreachable at launch; try again now.
  useEffect(() => {
    refresh();
  }, [refresh]);

  const restore = () => {
    setRestoreMessage(null);
    pro
      .restore()
      .then(result => {
        setRestoreMessage(t(RESTORE_MESSAGES[result]));
      })
      .catch((error: unknown) => {
        console.error('Restore failed', error);
      });
  };

  const status = pro.isPro
    ? t('pro.owned')
    : pro.status === 'pending'
      ? t('pro.pending')
      : pro.status === 'error' && pro.error
        ? t(ERROR_KEYS[pro.error])
        : null;

  return (
    <Screen testID="paywall-screen">
      <AppText variant="headlineSmall" accessibilityRole="header">
        {t('pro.title')}
      </AppText>
      <AppText variant="bodyLarge">{t('pro.intro')}</AppText>
      <View>
        {BENEFITS.map(benefit => (
          <ListRow key={benefit.key} icon={benefit.icon} title={t(`pro.${benefit.key}`)} />
        ))}
      </View>
      {status ? (
        <AppText
          variant="bodyMedium"
          accessibilityLiveRegion="polite"
          style={pro.status === 'error' ? { color: theme.colors.error } : undefined}
          testID="pro-status"
        >
          {status}
        </AppText>
      ) : null}
      {pro.isPro ? null : (
        <>
          <AppButton
            label={pro.offer ? t('pro.buy', { price: pro.offer.price }) : t('pro.buyNoPrice')}
            icon="lock-open-variant-outline"
            onPress={pro.buy}
            disabled={!pro.offer || pro.status === 'purchasing' || pro.status === 'pending'}
            testID="pro-buy"
          />
          {pro.offer ? null : <AppText variant="bodySmall">{t('pro.unavailable')}</AppText>}
          <AppButton
            label={t('pro.restore')}
            accessibilityHint={t('pro.restoreHint')}
            mode="text"
            onPress={restore}
            testID="pro-restore"
          />
          {restoreMessage ? (
            <AppText variant="bodyMedium" accessibilityLiveRegion="polite">
              {restoreMessage}
            </AppText>
          ) : null}
        </>
      )}
      <AppButton
        label={pro.isPro ? t('licences.close') : t('pro.notNow')}
        mode="text"
        onPress={() => {
          navigation.goBack();
        }}
        testID="pro-close"
      />
    </Screen>
  );
}
