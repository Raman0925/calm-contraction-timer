// SPDX-License-Identifier: Apache-2.0
import { Pressable, StyleSheet, View } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';
import { radius, spacing, touchTarget } from '../tokens';
import { AppText } from './AppText';
import { Icon } from './Icon';

interface SessionCardProps {
  title: string;
  subtitle: string;
  details: string;
  /** Shown as a label when a contraction in the session is still running. */
  badge?: string;
  onPress: () => void;
  accessibilityHint?: string;
  testID?: string;
}

/** A tappable summary of one session in the History list. */
export function SessionCard({
  title,
  subtitle,
  details,
  badge,
  onPress,
  accessibilityHint,
  testID,
}: SessionCardProps) {
  const theme = useAppTheme();
  const muted = { color: theme.colors.onSurfaceVariant };
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, details, badge].filter(Boolean).join(', ')}
      accessibilityHint={accessibilityHint}
      android_ripple={{ color: theme.colors.outlineVariant }}
      style={[styles.card, { backgroundColor: theme.colors.elevation.level1 }]}
      testID={testID}
    >
      <View style={styles.text}>
        <AppText variant="titleMedium">{title}</AppText>
        <AppText variant="bodyMedium" style={muted}>
          {subtitle}
        </AppText>
        <AppText variant="bodyMedium">{details}</AppText>
        {badge ? (
          <AppText variant="labelMedium" style={{ color: theme.colors.primary }}>
            {badge}
          </AppText>
        ) : null}
      </View>
      <Icon name="chevron-right" color={theme.colors.onSurfaceVariant} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    minHeight: touchTarget.min,
    padding: spacing.lg,
    borderRadius: radius.md,
    overflow: 'hidden',
  },
  text: { flex: 1, gap: spacing.xs },
});
