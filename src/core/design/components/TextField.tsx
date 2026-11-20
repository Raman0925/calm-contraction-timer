// SPDX-License-Identifier: Apache-2.0
import { TextInput } from 'react-native-paper';

interface TextFieldProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  multiline?: boolean;
  maxLength?: number;
  keyboardType?: 'default' | 'phone-pad' | 'number-pad';
  testID?: string;
}

/** Outlined text input with a visible label that is also its accessible name. */
export function TextField({
  label,
  value,
  onChangeText,
  multiline = false,
  maxLength,
  keyboardType = 'default',
  testID,
}: TextFieldProps) {
  return (
    <TextInput
      mode="outlined"
      label={label}
      accessibilityLabel={label}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      maxLength={maxLength}
      keyboardType={keyboardType}
      testID={testID}
    />
  );
}
