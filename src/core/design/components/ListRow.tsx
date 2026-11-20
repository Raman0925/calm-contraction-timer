// SPDX-License-Identifier: Apache-2.0
import { List } from 'react-native-paper';
import { Icon, type IconName } from './Icon';

interface ListRowProps {
  title: string;
  description?: string;
  icon?: IconName;
  onPress?: () => void;
  accessibilityHint?: string;
  testID?: string;
}

/** A list row whose text wraps instead of truncating, so it survives large font sizes. */
export function ListRow({
  title,
  description,
  icon,
  onPress,
  accessibilityHint,
  testID,
}: ListRowProps) {
  return (
    <List.Item
      title={title}
      description={description}
      titleNumberOfLines={0}
      descriptionNumberOfLines={0}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : 'text'}
      accessibilityHint={accessibilityHint}
      left={icon ? ({ color }: { color: string }) => <Icon name={icon} color={color} /> : undefined}
      testID={testID}
    />
  );
}
