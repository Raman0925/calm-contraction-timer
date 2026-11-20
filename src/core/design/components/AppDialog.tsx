// SPDX-License-Identifier: Apache-2.0
import type { ReactElement, ReactNode } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Dialog, Portal } from 'react-native-paper';
import { spacing } from '../tokens';

interface AppDialogProps {
  visible: boolean;
  title: string;
  onDismiss: () => void;
  /** Buttons along the bottom edge, each with a `key`. Not a Fragment: Paper passes props to each. */
  actions: ReactElement[];
  children: ReactNode;
  testID?: string;
}

/** Modal dialog whose body scrolls, so long content survives large font sizes. */
export function AppDialog({
  visible,
  title,
  onDismiss,
  actions,
  children,
  testID,
}: AppDialogProps) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} testID={testID}>
        <Dialog.Title accessibilityRole="header">{title}</Dialog.Title>
        <Dialog.ScrollArea>
          <ScrollView contentContainerStyle={styles.body}>{children}</ScrollView>
        </Dialog.ScrollArea>
        <Dialog.Actions style={styles.actions}>{actions}</Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg, paddingVertical: spacing.lg },
  actions: { flexWrap: 'wrap', gap: spacing.sm },
});
