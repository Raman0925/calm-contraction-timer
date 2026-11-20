// SPDX-License-Identifier: Apache-2.0
import { RadioButton } from 'react-native-paper';

/** One option in a {@link ChoiceList}. */
export interface Choice<T extends string> {
  value: T;
  label: string;
}

interface ChoiceListProps<T extends string> {
  choices: readonly Choice<T>[];
  selected: T;
  onChange: (value: T) => void;
  testID?: string;
}

/** Single-choice list of radio rows. Rows wrap text, so it survives 200% font scale. */
export function ChoiceList<T extends string>({
  choices,
  selected,
  onChange,
  testID,
}: ChoiceListProps<T>) {
  const handleChange = (value: string) => {
    const match = choices.find(choice => choice.value === value);
    if (match) {
      onChange(match.value);
    }
  };

  return (
    <RadioButton.Group value={selected} onValueChange={handleChange}>
      {choices.map(choice => (
        <RadioButton.Item
          key={choice.value}
          value={choice.value}
          label={choice.label}
          testID={testID ? `${testID}-${choice.value}` : undefined}
        />
      ))}
    </RadioButton.Group>
  );
}
