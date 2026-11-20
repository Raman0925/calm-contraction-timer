// SPDX-License-Identifier: Apache-2.0
import { StyleSheet, View } from 'react-native';
import { useAppTheme } from '../theme/useAppTheme';
import { spacing } from '../tokens';
import { AppText } from './AppText';
import { Icon, type IconName } from './Icon';

interface EmptyStateProps {
  icon: IconName;
  title: string;
  message?: string;
  testID?: string;
}

/** Friendly placeholder shown when a list or screen has nothing to show yet. */
export function EmptyState({ icon, title, message, testID }: EmptyStateProps) {
  const theme = useAppTheme();
  return (
    <View style={styles.root} testID={testID} accessible accessibilityRole="text">
      <Icon name={icon} size={48} color={theme.colors.onSurfaceVariant} />
      <AppText variant="titleMedium" style={styles.text}>
        {title}
      </AppText>
      {message ? (
        <AppText
          variant="bodyMedium"
          style={[styles.text, { color: theme.colors.onSurfaceVariant }]}
        >
          {message}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  text: { textAlign: 'center' },
});
