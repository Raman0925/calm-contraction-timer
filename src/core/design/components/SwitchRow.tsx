// SPDX-License-Identifier: Apache-2.0
import { List, Switch } from 'react-native-paper';

interface SwitchRowProps {
  title: string;
  description?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  testID?: string;
}

/** A full-width row that toggles a setting; the whole row is the touch target. */
export function SwitchRow({ title, description, value, onValueChange, testID }: SwitchRowProps) {
  const toggle = () => {
    onValueChange(!value);
  };
  return (
    <List.Item
      title={title}
      description={description}
      titleNumberOfLines={0}
      descriptionNumberOfLines={0}
      onPress={toggle}
      accessibilityRole="switch"
      accessibilityLabel={title}
      accessibilityState={{ checked: value }}
      testID={testID}
      right={() => (
        <Switch value={value} onValueChange={onValueChange} importantForAccessibility="no" />
      )}
    />
  );
}
