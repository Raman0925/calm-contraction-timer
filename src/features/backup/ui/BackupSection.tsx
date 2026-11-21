// SPDX-License-Identifier: Apache-2.0
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { AppButton, AppDialog, AppText, useAppTheme } from '@core/design';
import { formatDay } from '@core/utils/dateFormat';
import { useIsPro } from '@features/paywall/ui/ProServices';
import type { BackupMessage } from './useBackup';
import { useBackup } from './useBackup';

const ERROR_KEYS = {
  'not-a-backup': 'backup.errorNotABackup',
  'newer-version': 'backup.errorNewerVersion',
  invalid: 'backup.errorInvalid',
  'save-failed': 'backup.errorSave',
  'open-failed': 'backup.errorOpen',
  'restore-failed': 'backup.errorRestore',
} as const;

/** Back up to a file and restore from one (Pro). */
export function BackupSection() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const navigation = useNavigation();
  const isPro = useIsPro();
  const { busy, message, pending, backup, chooseRestore, confirmRestore, cancelRestore } =
    useBackup();

  const openPaywall = () => {
    navigation.navigate('Paywall');
  };
  const label = (action: string) => (isPro ? action : t('backup.pro', { action }));

  const describe = (outcome: BackupMessage): string => {
    switch (outcome.kind) {
      case 'saved':
        return t('backup.saved');
      case 'restored':
        return t('backup.restored', { count: outcome.count });
      case 'error':
        return t(ERROR_KEYS[outcome.reason]);
    }
  };

  return (
    <>
      <AppText variant="titleSmall" accessibilityRole="header">
        {t('backup.title')}
      </AppText>
      <AppText variant="bodyMedium">{t('backup.description')}</AppText>
      <AppButton
        label={label(t('backup.save'))}
        accessibilityHint={isPro ? t('backup.saveHint') : t('backup.proHint')}
        icon={isPro ? 'content-save-outline' : 'lock-outline'}
        mode="outlined"
        onPress={isPro ? backup : openPaywall}
        disabled={busy}
        testID="backup-save"
      />
      <AppButton
        label={label(t('backup.restore'))}
        accessibilityHint={isPro ? t('backup.restoreHint') : t('backup.proHint')}
        icon={isPro ? 'file-restore-outline' : 'lock-outline'}
        mode="outlined"
        onPress={isPro ? chooseRestore : openPaywall}
        disabled={busy}
        testID="backup-restore"
      />
      {message ? (
        <AppText
          variant="bodyMedium"
          accessibilityLiveRegion="polite"
          style={message.kind === 'error' ? { color: theme.colors.error } : undefined}
          testID="backup-message"
        >
          {describe(message)}
        </AppText>
      ) : null}
      <AppDialog
        visible={pending !== null}
        title={t('backup.confirmTitle')}
        onDismiss={cancelRestore}
        actions={[
          <AppButton key="cancel" label={t('backup.cancel')} mode="text" onPress={cancelRestore} />,
          <AppButton
            key="replace"
            label={t('backup.confirm')}
            onPress={confirmRestore}
            testID="backup-confirm"
          />,
        ]}
      >
        {pending ? (
          <AppText variant="bodyMedium">
            {t('backup.confirmCurrent', { count: pending.currentCount })}{' '}
            {t('backup.confirmBackup', {
              count: pending.backup.contractions.length,
              day: formatDay(pending.backup.createdAt),
            })}
          </AppText>
        ) : null}
      </AppDialog>
    </>
  );
}
