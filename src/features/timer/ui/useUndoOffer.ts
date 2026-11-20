// SPDX-License-Identifier: Apache-2.0
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

/** A message in the snackbar, with an Undo action when one is possible. */
export interface UndoOffer {
  /** Unique per offer, so a new offer always gets the full Undo time. */
  id: number;
  message: string;
  /** Reverts the last action; resolves false if it could no longer be undone. */
  undo?: () => Promise<boolean>;
}

/** State and actions for the Undo snackbar. */
export interface UndoOfferState {
  undoOffer: UndoOffer | null;
  /** Shows `message`, with an Undo button when `undo` is given. */
  offer: (message: string, undo?: () => Promise<boolean>) => void;
  undo: () => void;
  dismissUndo: (offerId: number) => void;
}

/** Holds the current Undo offer and reports when an Undo could not be applied. */
export function useUndoOffer(): UndoOfferState {
  const { t } = useTranslation();
  const [undoOffer, setUndoOffer] = useState<UndoOffer | null>(null);
  const nextId = useRef(1);

  const offer = useCallback((message: string, undo?: () => Promise<boolean>) => {
    setUndoOffer({ id: nextId.current++, message, undo });
  }, []);

  const undo = useCallback(() => {
    const action = undoOffer?.undo;
    setUndoOffer(null);
    action?.()
      .then(undone => {
        if (!undone) {
          offer(t('timer.undoFailed'));
        }
      })
      .catch((error: unknown) => {
        console.error('Undo failed', error);
        offer(t('timer.undoFailed'));
      });
  }, [undoOffer, offer, t]);

  const dismissUndo = useCallback((offerId: number) => {
    setUndoOffer(current => (current?.id === offerId ? null : current));
  }, []);

  return { undoOffer, offer, undo, dismissUndo };
}
