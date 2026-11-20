// SPDX-License-Identifier: Apache-2.0
import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useAppTheme } from '../theme/useAppTheme';
import { spacing } from '../tokens';

interface ScreenProps {
  children: ReactNode;
  /** Wrap content in a ScrollView so large font scales never clip. Defaults to true. */
  scroll?: boolean;
  /** Safe-area edges to pad. Headers and tab bars already handle top and bottom. */
  edges?: readonly Edge[];
  testID?: string;
}

const DEFAULT_EDGES: readonly Edge[] = ['left', 'right'];

/** Root container for every screen: themed background, safe area, padding. */
export function Screen({ children, scroll = true, edges = DEFAULT_EDGES, testID }: ScreenProps) {
  const theme = useAppTheme();
  const background = { backgroundColor: theme.colors.background };

  return (
    <SafeAreaView style={[styles.root, background]} edges={edges} testID={testID}>
      {scroll ? (
        <ScrollView contentContainerStyle={styles.content}>{children}</ScrollView>
      ) : (
        <View style={[styles.root, styles.content]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.lg, gap: spacing.lg },
});
