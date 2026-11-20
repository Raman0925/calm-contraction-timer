// SPDX-License-Identifier: Apache-2.0
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AppButton,
  AppDialog,
  AppText,
  ChipChoice,
  Stepper,
  TextField,
  useAppTheme,
  type ChipOption,
} from '@core/design';
import { formatTime } from '@core/utils/dateFormat';
import { formatClock } from '@core/utils/format';
import { MINUTE_MS, SECOND_MS } from '@core/utils/time';
import {
  MAX_NOTE_LENGTH,
  type Contraction,
  type Intensity,
} from '@features/timer/domain/contraction';
import {
  changeDuration,
  shiftStart,
  toDraft,
  type ContractionDraft,
} from '../domain/contractionDraft';
import type { UpdateError } from '@features/timer/data/contractionRepository';

const STEP_DELTAS = [-MINUTE_MS, -10 * SECOND_MS, 10 * SECOND_MS, MINUTE_MS];

/** Message for each reason a save can fail. */
const ERROR_KEYS = {
  invalid: 'edit.invalid',
  conflict: 'edit.invalid',
  'not-found': 'edit.notFound',
  failed: 'edit.failed',
} as const;

interface ContractionEditorProps {
  contraction: Contraction;
  /** Edited times can never pass this moment. */
  now: number;
  /** Resolves the error, or null when saved. */
  onSave: (draft: ContractionDraft) => Promise<UpdateError | null>;
  onDelete: () => void;
  onDismiss: () => void;
}

/** Dialog to adjust a contraction's times, intensity and note, or delete it. */
export function ContractionEditor({
  contraction,
  now,
  onSave,
  onDelete,
  onDismiss,
}: ContractionEditorProps) {
  const { t } = useTranslation();
  const theme = useAppTheme();
  const [draft, setDraft] = useState(() => toDraft(contraction));
  const [error, setError] = useState<keyof typeof ERROR_KEYS | null>(null);
  const running = draft.durationMs === null;

  const update = (next: ContractionDraft) => {
    setError(null);
    setDraft(next);
  };
  const stepLabels = [
    t('edit.minusMinute'),
    t('edit.minusTenSeconds'),
    t('edit.plusTenSeconds'),
    t('edit.plusMinute'),
  ];
  /** Four buttons: -1 min, -10 s, +10 s, +1 min, each with its own spoken label. */
  const steps = (
    apply: (d: ContractionDraft, delta: number, now: number) => ContractionDraft,
    spoken: string[],
  ) =>
    STEP_DELTAS.map((delta, i) => ({
      label: stepLabels[i] ?? '',
      accessibilityLabel: spoken[i] ?? '',
      onPress: () => {
        update(apply(draft, delta, now));
      },
    }));

  const intensityOptions: ChipOption<Intensity | null>[] = [
    { value: null, label: t('edit.intensityNone') },
    { value: 1, label: t('edit.intensityMild') },
    { value: 2, label: t('edit.intensityModerate') },
    { value: 3, label: t('edit.intensityStrong') },
  ];

  const save = () => {
    onSave(draft)
      .then(result => {
        if (result === null) {
          onDismiss();
        } else {
          setError(result);
        }
      })
      .catch((cause: unknown) => {
        console.error('Saving the contraction failed', cause);
        setError('failed');
      });
  };

  return (
    <AppDialog
      visible
      title={t('edit.title')}
      onDismiss={onDismiss}
      testID="contraction-editor"
      actions={[
        <AppButton
          key="delete"
          label={t('edit.delete')}
          mode="text"
          icon="delete-outline"
          onPress={onDelete}
        />,
        <AppButton key="cancel" label={t('edit.cancel')} mode="text" onPress={onDismiss} />,
        <AppButton key="save" label={t('edit.save')} onPress={save} testID="editor-save" />,
      ]}
    >
      <Stepper
        label={t('edit.start')}
        value={formatTime(draft.startedAt)}
        steps={steps(shiftStart, [
          t('edit.earlierMinute'),
          t('edit.earlierTenSeconds'),
          t('edit.laterTenSeconds'),
          t('edit.laterMinute'),
        ])}
      />
      <Stepper
        label={t('edit.length')}
        value={running ? t('edit.stillRunning') : formatClock(draft.durationMs ?? 0)}
        disabled={running}
        steps={steps(changeDuration, [
          t('edit.shorterMinute'),
          t('edit.shorterTenSeconds'),
          t('edit.longerTenSeconds'),
          t('edit.longerMinute'),
        ])}
      />
      <ChipChoice
        label={t('edit.intensity')}
        options={intensityOptions}
        selected={draft.intensity}
        onChange={intensity => {
          update({ ...draft, intensity });
        }}
      />
      <TextField
        label={t('edit.note')}
        value={draft.note}
        onChangeText={note => {
          update({ ...draft, note });
        }}
        multiline
        maxLength={MAX_NOTE_LENGTH}
        testID="editor-note"
      />
      {error ? (
        <AppText
          variant="bodyMedium"
          style={{ color: theme.colors.error }}
          accessibilityLiveRegion="polite"
        >
          {t(ERROR_KEYS[error])}
        </AppText>
      ) : null}
    </AppDialog>
  );
}
