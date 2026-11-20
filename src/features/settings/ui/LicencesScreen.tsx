// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList } from 'react-native';
import { AppButton, AppDialog, AppText, ListRow, Screen } from '@core/design';
import { licenceTexts, licencedPackages, type LicencedPackage } from '../data/licences';

/** Every open-source package in the app, with its licence text on tap. */
export function LicencesScreen() {
  const { t } = useTranslation();
  const [open, setOpen] = useState<LicencedPackage | null>(null);
  const close = () => {
    setOpen(null);
  };
  const text = open?.text == null ? null : licenceTexts[open.text];

  return (
    <Screen scroll={false} testID="licences-screen">
      <FlatList
        data={licencedPackages}
        keyExtractor={item => `${item.name}@${item.version}`}
        ListHeaderComponent={<AppText variant="bodyMedium">{t('licences.intro')}</AppText>}
        renderItem={({ item }) => (
          <ListRow
            title={`${item.name} ${item.version}`}
            description={item.licence}
            onPress={() => {
              setOpen(item);
            }}
          />
        )}
        initialNumToRender={20}
      />
      <AppDialog
        visible={open !== null}
        title={open ? `${open.name} ${open.version}` : ''}
        onDismiss={close}
        actions={[
          <AppButton key="close" label={t('licences.close')} mode="text" onPress={close} />,
        ]}
      >
        <AppText variant="bodySmall" selectable>
          {text ?? [open?.licence, open?.repository].filter(Boolean).join('\n')}
        </AppText>
      </AppDialog>
    </Screen>
  );
}
