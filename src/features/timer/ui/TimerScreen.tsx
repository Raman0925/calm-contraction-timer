// SPDX-License-Identifier: Apache-2.0
import { useIsFocused } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Linking, StyleSheet, View } from 'react-native';
import {
  AppButton,
  BigToggleButton,
  LiveTimerText,
  Screen,
  UndoSnackbar,
  spacing,
} from '@core/design';
import { useSettingsStore } from '@features/settings/data/settingsStore';
import { LastHourStats } from './LastHourStats';
import { PatternCard } from './PatternCard';
import { RecentContractions } from './RecentContractions';
import { useKeepAwake } from './useKeepAwake';
import { useTimer } from './useTimer';
import { useTimerServices } from './TimerServices';

/** Home screen with the big Start/Stop button. Never shows ads or upsells. */
export function TimerScreen() {
  const { t } = useTranslation();
  const timer = useTimer();
  const { keepAwake } = useTimerServices();
  const keepAwakeEnabled = useSettingsStore(state => state.keepAwake);
  const providerPhone = useSettingsStore(state => state.providerPhone.trim());
  const emergencyPhone = useSettingsStore(state => state.emergencyPhone.trim());
  const focused = useIsFocused();
  const { undoOffer } = timer;
  useKeepAwake(keepAwake, keepAwakeEnabled && focused && timer.sessionActive);

  const label = timer.contracting
    ? t('timer.contractionLabel')
    : timer.elapsedMs === null
      ? t('timer.readyLabel')
      : t('timer.sinceLastLabel');

  const call = (phone: string) => () => {
    Linking.openURL(`tel:${phone}`).catch((error: unknown) => {
      console.error('Could not open the dialler', error);
    });
  };

  return (
    <Screen
      testID="timer-screen"
      overlay={
        <UndoSnackbar
          key={undoOffer?.id ?? 0}
          message={undoOffer?.message ?? null}
          undoLabel={undoOffer?.undo ? t('timer.undo') : undefined}
          onUndo={timer.undo}
          onDismiss={() => {
            if (undoOffer) {
              timer.dismissUndo(undoOffer.id);
            }
          }}
        />
      }
    >
      {timer.sessionActive ? <PatternCard pattern={timer.stats.pattern} /> : null}
      <View style={styles.timer}>
        <LiveTimerText valueMs={timer.elapsedMs} label={label} testID="live-timer" />
      </View>
      <BigToggleButton
        active={timer.contracting}
        startLabel={t('timer.start')}
        stopLabel={t('timer.stop')}
        startHint={t('timer.startHint')}
        stopHint={t('timer.stopHint')}
        onPress={timer.toggle}
        disabled={!timer.loaded || timer.busy}
        testID="start-stop"
      />
      {timer.sessionActive ? <LastHourStats averages={timer.stats.lastHour} /> : null}
      {providerPhone ? (
        <AppButton
          label={t('timer.callProvider')}
          accessibilityHint={t('timer.callProviderHint')}
          icon="phone"
          mode="outlined"
          onPress={call(providerPhone)}
          testID="call-provider"
        />
      ) : null}
      {emergencyPhone ? (
        <AppButton
          label={t('timer.callEmergency')}
          accessibilityHint={t('timer.callProviderHint')}
          icon="phone-alert"
          mode="outlined"
          onPress={call(emergencyPhone)}
          testID="call-emergency"
        />
      ) : null}
      {timer.sessionActive ? <RecentContractions items={timer.recent} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  timer: { paddingVertical: spacing.xl },
});
