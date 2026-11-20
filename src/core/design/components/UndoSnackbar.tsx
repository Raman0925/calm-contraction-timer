// SPDX-License-Identifier: Apache-2.0
import { Snackbar } from 'react-native-paper';

/** How long Undo stays available, in ms. */
export const UNDO_DURATION_MS = 5_000;

interface UndoSnackbarProps {
  /** Message to show; null hides the snackbar. */
  message: string | null;
  /** Label of the Undo button. Omit to show the message without a button. */
  undoLabel?: string;
  onUndo: () => void;
  onDismiss: () => void;
}

/**
 * Bottom message with an optional Undo button, shown for {@link UNDO_DURATION_MS}.
 * Give each new message a new React `key` so it gets the full time.
 */
export function UndoSnackbar({ message, undoLabel, onUndo, onDismiss }: UndoSnackbarProps) {
  return (
    <Snackbar
      visible={message !== null}
      onDismiss={onDismiss}
      duration={UNDO_DURATION_MS}
      action={
        undoLabel ? { label: undoLabel, onPress: onUndo, accessibilityLabel: undoLabel } : undefined
      }
      testID="undo-snackbar"
    >
      {message ?? ''}
    </Snackbar>
  );
}
