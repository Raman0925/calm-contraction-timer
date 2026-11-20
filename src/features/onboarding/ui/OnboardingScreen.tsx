// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, StyleSheet, View } from 'react-native';
import {
  AppButton,
  AppText,
  Icon,
  Screen,
  spacing,
  useAppTheme,
  type IconName,
} from '@core/design';
import { useSettingsStore } from '@features/settings/data/settingsStore';
import { useTimerServices } from '@features/timer/ui/TimerServices';

interface Card {
  icon: IconName;
  title: string;
  body: string;
}

/**
 * Three short cards. The last shows the medical disclaimer; accepting it is
 * stored and unlocks the app. No animations, so it suits reduce motion.
 */
export function OnboardingScreen() {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const { clock } = useTimerServices();
  const acceptDisclaimer = useSettingsStore(state => state.acceptDisclaimer);
  const [step, setStep] = useState(0);

  const cards: Card[] = [
    {
      icon: 'gesture-tap-button',
      title: t('onboarding.timeTitle'),
      body: t('onboarding.timeBody'),
    },
    {
      icon: 'chart-timeline-variant',
      title: t('onboarding.patternTitle'),
      body: t('onboarding.patternBody'),
    },
    { icon: 'medical-bag', title: t('onboarding.disclaimerTitle'), body: t('disclaimer.body') },
  ];
  // Android back steps back through the cards instead of closing the app.
  useEffect(() => {
    if (step === 0) {
      return;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      setStep(step - 1);
      return true;
    });
    return () => {
      subscription.remove();
    };
  }, [step]);

  const card = cards[step] ?? cards[0];
  const last = step === cards.length - 1;

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']} testID="onboarding-screen">
      <AppText variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
        {t('onboarding.step', { step: step + 1, steps: cards.length })}
      </AppText>
      {card ? (
        <View style={styles.card}>
          <Icon name={card.icon} size={64} color={theme.colors.primary} />
          <AppText variant="headlineMedium" accessibilityRole="header">
            {card.title}
          </AppText>
          <AppText variant="bodyLarge">{card.body}</AppText>
        </View>
      ) : null}
      <View style={styles.actions}>
        {last ? (
          <AppButton
            label={t('onboarding.accept')}
            onPress={() => {
              acceptDisclaimer(clock.now());
            }}
            testID="onboarding-accept"
          />
        ) : (
          <AppButton
            label={t('onboarding.next')}
            onPress={() => {
              setStep(step + 1);
            }}
            testID="onboarding-next"
          />
        )}
        {step > 0 ? (
          <AppButton
            label={t('onboarding.back')}
            mode="text"
            onPress={() => {
              setStep(step - 1);
            }}
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { flexGrow: 1, justifyContent: 'center', gap: spacing.lg },
  actions: { gap: spacing.sm },
});
