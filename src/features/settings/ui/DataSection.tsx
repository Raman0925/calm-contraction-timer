// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppButton, AppDialog, AppText } from '@core/design';
import { useBackupFiles } from '@features/backup/ui/BackupServices';
import { useFileSharer } from '@features/export/ui/ExportServices';
import { useTimerServices } from '@features/timer/ui/TimerServices';

/** Where data lives, and deleting all of it after a confirmation. */
export function DataSection() {
  const { t } = useTranslation();
  const { repository } = useTimerServices();
  const sharer = useFileSharer();
  const backupFiles = useBackupFiles();
  const [confirming, setConfirming] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const deleteAll = () => {
    setConfirming(false);
    Promise.all([repository.removeAll(), sharer.clearExports(), backupFiles.clearTemporaryFiles()])
      .then(() => {
        setDeleted(true);
      })
      .catch((error: unknown) => {
        console.error('Deleting all contractions failed', error);
      });
  };
  const cancel = () => {
    setConfirming(false);
  };

  return (
    <>
      <AppText variant="titleSmall" accessibilityRole="header">
        {t('settings.dataSection')}
      </AppText>
      <AppText variant="bodyMedium">{t('settings.dataDescription')}</AppText>
      <AppButton
        label={t('settings.deleteAll')}
        accessibilityHint={t('settings.deleteAllHint')}
        icon="delete-forever-outline"
        mode="outlined"
        onPress={() => {
          setDeleted(false);
          setConfirming(true);
        }}
        testID="delete-all"
      />
      {deleted ? (
        <AppText variant="bodyMedium" accessibilityLiveRegion="polite">
          {t('settings.deleteAllDone')}
        </AppText>
      ) : null}
      <AppDialog
        visible={confirming}
        title={t('settings.deleteAllTitle')}
        onDismiss={cancel}
        actions={[
          <AppButton key="cancel" label={t('settings.cancel')} mode="text" onPress={cancel} />,
          <AppButton
            key="delete"
            label={t('settings.deleteAllConfirm')}
            onPress={deleteAll}
            testID="delete-all-confirm"
          />,
        ]}
      >
        <AppText variant="bodyMedium">{t('settings.deleteAllMessage')}</AppText>
      </AppDialog>
    </>
  );
}
