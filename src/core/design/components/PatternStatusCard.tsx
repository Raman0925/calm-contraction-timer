// SPDX-License-Identifier: Apache-2.0
import { StyleSheet, View } from 'react-native';
import type { AppTheme } from '../theme/themes';
import { useAppTheme } from '../theme/useAppTheme';
import { radius, spacing } from '../tokens';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

/** Pattern states, mirroring the timer domain's pattern status. */
export type PatternCardState = 'none' | 'building' | 'matched';

interface PatternStatusCardProps {
  state: PatternCardState;
  message: string;
  footnote: string;
  testID?: string;
}

const ICONS: Record<PatternCardState, IconName> = {
  none: 'information-outline',
  building: 'chart-timeline-variant',
  matched: 'check-circle-outline',
};

function coloursFor(state: PatternCardState, theme: AppTheme): [string, string] {
  switch (state) {
    case 'matched':
      return [theme.colors.tertiaryContainer, theme.colors.onTertiaryContainer];
    case 'building':
      return [theme.colors.secondaryContainer, theme.colors.onSecondaryContainer];
    case 'none':
      return [theme.colors.surfaceVariant, theme.colors.onSurfaceVariant];
  }
}

/** Neutral, informational summary of the pattern. Never an instruction. */
export function PatternStatusCard({ state, message, footnote, testID }: PatternStatusCardProps) {
  const theme = useAppTheme();
  const [background, foreground] = coloursFor(state, theme);
  const text = { color: foreground };

  return (
    <View
      style={[styles.card, { backgroundColor: background }]}
      accessible
      accessibilityLabel={`${message}. ${footnote}`}
      testID={testID}
    >
      <Icon name={ICONS[state]} color={foreground} />
      <View style={styles.text}>
        <AppText variant="titleSmall" style={text}>
          {message}
        </AppText>
        <AppText variant="bodySmall" style={text}>
          {footnote}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'flex-start',
  },
  text: { flex: 1, gap: spacing.xs },
});
