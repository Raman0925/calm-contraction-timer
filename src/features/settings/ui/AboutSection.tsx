// SPDX-License-Identifier: Apache-2.0
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';
import { useAds } from '@core/ads/AdsProvider';
import { AppText, ListRow } from '@core/design';
import { PRIVACY_POLICY_URL, SOURCE_CODE_URL } from '@core/config';
import { version } from '../../../../package.json';

function openUrl(url: string) {
  Linking.openURL(url).catch((error: unknown) => {
    console.error('Could not open link', error);
  });
}

/** Disclaimer, privacy policy, licences, source code and version. */
export function AboutSection() {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { privacyOptionsRequired, showPrivacyOptions } = useAds();

  return (
    <>
      <AppText variant="titleSmall" accessibilityRole="header">
        {t('settings.aboutSection')}
      </AppText>
      <ListRow
        icon="medical-bag"
        title={t('settings.disclaimer')}
        onPress={() => {
          navigation.navigate('Disclaimer');
        }}
        testID="open-disclaimer"
      />
      <ListRow
        icon="shield-lock-outline"
        title={t('settings.privacyPolicy')}
        accessibilityHint={t('settings.opensBrowser')}
        onPress={() => {
          openUrl(PRIVACY_POLICY_URL);
        }}
      />
      {privacyOptionsRequired ? (
        <ListRow
          icon="cookie-settings-outline"
          title={t('settings.privacyOptions')}
          description={t('settings.privacyOptionsDescription')}
          onPress={showPrivacyOptions}
          testID="privacy-options"
        />
      ) : null}
      <ListRow
        icon="license"
        title={t('settings.licences')}
        onPress={() => {
          navigation.navigate('Licences');
        }}
        testID="open-licences"
      />
      <ListRow
        icon="github"
        title={t('settings.sourceCode')}
        description={SOURCE_CODE_URL}
        accessibilityHint={t('settings.opensBrowser')}
        onPress={() => {
          openUrl(SOURCE_CODE_URL);
        }}
      />
      <AppText variant="bodySmall">{t('settings.version', { version })}</AppText>
    </>
  );
}
